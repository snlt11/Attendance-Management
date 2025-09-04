<?php

namespace App\Http\Controllers\Auth\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Exceptions\MessageError;
use App\Models\Attendance;
use App\Models\ClassSession;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CheckInAttendanceController extends Controller
{
    public function __invoke(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                throw new MessageError('User not authenticated.', 401);
            }

            if ($user->role !== 'student') {
                throw new MessageError('Only students can scan QR codes for attendance.', 403);
            }


            $qrToken = $request->input('qr_token');
            if (!$qrToken || !is_string($qrToken) || strlen($qrToken) < 10) {
                throw new MessageError('QR token is required and must be valid.', 422);
            }

            // Find session with this QR token (do not filter by expiry yet)

            $session = ClassSession::where('qr_token', $qrToken)
                ->where('status', 'active')
                ->with(['class.subject', 'class.teacher', 'class.location'])
                ->first();

            if (!$session) {
                throw new MessageError('Invalid QR code. Please ask your teacher to generate a new one.', 404);
            }

            // Check QR code expiry

            if (!$session->expires_at || Carbon::now()->gt($session->expires_at)) {
                throw new MessageError('This QR code has expired. Please ask your teacher to generate a new one.', 410);
            }

            // Defensive: check for missing relationships
            if (!$session->class || !$session->class->subject || !$session->class->teacher || !$session->class->location) {
                throw new MessageError('Class session data is incomplete. Please contact your teacher or admin.', 422);
            }
            $isEnrolled = DB::table('class_students')
                ->where('class_id', $session->class_id)
                ->where('user_id', $user->id)
                ->exists();

            if (!$isEnrolled) {
                throw new MessageError('You are not enrolled in this class.', 403);
            }

            // Check if already checked in for this session
            $existingAttendance = Attendance::where('class_session_id', $session->id)
                ->where('user_id', $user->id)
                ->first();

            if ($existingAttendance) {
                return response()->json([
                    'message' => 'You have already checked in for this class session.',
                    'attendance' => $existingAttendance,
                    'session' => [
                        'class_name' => $session->class->name,
                        'subject' => $session->class->subject->name,
                        'teacher' => $session->class->teacher->name,
                        'location' => $session->class->location->name,
                        'session_date' => $session->session_date,
                        'start_time' => $session->start_time,
                        'end_time' => $session->end_time,
                    ]
                ], 409);
            }

            $now = $request->input('datetime') ? Carbon::parse($request->input('datetime'), 'Asia/Yangon') : Carbon::now('Asia/Yangon');

            $classStartDate = Carbon::parse($session->class->start_date, 'Asia/Yangon');
            $classEndDate = Carbon::parse($session->class->end_date, 'Asia/Yangon');

            // Check if class session is before the class start date

            if ($now->lt($classStartDate)) {
                throw new MessageError('You cannot check in before the class start date: ' . $classStartDate->format('Y-m-d') . '.', 403);
            }

            // Check if class session is in the future
            if ($now->gt($classEndDate)) {
                throw new MessageError('You cannot check in for a class that has already ended on ' . $classEndDate->format('Y-m-d') . '.', 403);
            }

            // Check class schedule start and end time
            $classStartTime = Carbon::parse($session->start_time, 'Asia/Yangon');
            $classEndTime = Carbon::parse($session->end_time, 'Asia/Yangon');

            // Allow check-in 15 minutes before class starts
            $earlyCheckInTime = (clone $classStartTime)->subMinutes(15);

            if ($now->lt($earlyCheckInTime) || $now->gt($classEndTime)) {
                throw new MessageError('You can check in starting 15 minutes before class (' .
                    $earlyCheckInTime->format('H:i') . ') until class ends at ' .
                    $classEndTime->format('H:i') . '.', 403);
            }

            // latitude and longitude
            $latitude = $request->input('latitude');
            $longitude = $request->input('longitude');


            if ($latitude === null || $longitude === null) {
                throw new MessageError('Your location is required to check in.', 422);
            }


            if (
                empty($session->class->location->latitude) || empty($session->class->location->longitude) ||
                $session->class->location->latitude == 0 || $session->class->location->longitude == 0
            ) {
                throw new MessageError('This class does not have a location set. Please contact your teacher.', 422);
            }


            if (!$this->checkLocation($latitude, $longitude, $session->class->location->latitude, $session->class->location->longitude)) {
                throw new MessageError('You are not close enough to the class location to check in.', 403);
            }

            $lateThreshold = (clone $classStartTime)->addMinutes(30);
            $status = $now->gt($lateThreshold) ? 'late' : 'present';

            // Create attendance record
            $attendance = Attendance::create([
                'user_id' => $user->id,
                'class_session_id' => $session->id,
                'status' => $status,
                'checked_in_at' => $now,
            ]);

            return response()->json([
                'message' => 'Attendance marked successfully!',
                'attendance' => $attendance,
                'session' => [
                    'class_name' => $session->class->name,
                    'subject' => $session->class->subject->name,
                    'teacher' => $session->class->teacher->name,
                    'location' => $session->class->location->name,
                    'session_date' => $session->session_date,
                    'start_time' => $session->start_time,
                    'end_time' => $session->end_time,
                ]
            ], 201);
        } catch (MessageError $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'success' => false
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An unexpected error occurred. Please try again.',
                'success' => false
            ], 500);
        }
    }

    private function checkLocation($userLat, $userLon, $locationLat, $locationLon)
    {
        if ($locationLat === null || $locationLon === null || $locationLat == 0 || $locationLon == 0) {
            return false;
        }

        $earthRadius = 6371000; // meters

        $latFrom = deg2rad(floatval($userLat));
        $lonFrom = deg2rad(floatval($userLon));
        $latTo = deg2rad(floatval($locationLat));
        $lonTo = deg2rad(floatval($locationLon));

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));

        $distance = $angle * $earthRadius;

        return $distance <= 100; // true if within 100 meters
    }
}
