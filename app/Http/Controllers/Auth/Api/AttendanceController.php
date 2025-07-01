<?php

namespace App\Http\Controllers\Auth\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Exceptions\MessageError;
use App\Models\Attendance;
use App\Models\ClassSession;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            throw new MessageError('User not authenticated.');
        }

        $classSessionId = $request->class_session_id;
        if (!$classSessionId) {
            throw new MessageError('class_session_id is required.');
        }

        $classSession = ClassSession::find($classSessionId);
        if (!$classSession) {
            throw new MessageError('Class session does not exist.');
        }

        if ($classSession->status !== 'active') {
            throw new MessageError('Class session is not active.');
        }

        if ($classSession->end_time && Carbon::now()->gt(Carbon::parse($classSession->end_time))) {
            throw new MessageError('Class session has already ended.');
        }

        if ($classSession->start_time && Carbon::now()->lt(Carbon::parse($classSession->start_time))) {
            throw new MessageError('Class session has not started yet.');
        }

        if ($classSession->start_time && Carbon::now()->diffInMinutes(Carbon::parse($classSession->start_time)) > 15) {
            throw new MessageError('You can only check in attendance within 15 minutes of the class session start time.');
        }

        if ($user->role !== 'student') {
            throw new MessageError('Only students can check in attendance.');
        }

        $attendance = Attendance::where('class_session_id', $classSession->id)
            ->where('user_id', $user->id)
            ->first();
        if ($attendance) {
            throw new MessageError('You have already checked in attendance for this class session.');
        }

        $attendance = Attendance::create([
            'user_id' => $user->id,
            'class_session_id' => $classSession->id,
            'status' => 'present',
            'checked_in_at' => Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Attendance checked in successfully.',
            'attendance' => $attendance,
        ], 201);
    }
}
