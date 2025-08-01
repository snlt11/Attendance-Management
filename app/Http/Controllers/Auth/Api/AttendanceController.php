<?php

namespace App\Http\Controllers\Auth\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized. Only authenticated users can access attendance records.'
            ], 401);
        }

        $classId = $request->query('class_id');

        $attendanceRecords = $this->getAttendanceRecords($user->id, $classId);

        $formattedRecords = $this->formatAttendanceRecordsByClass($attendanceRecords);

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $formattedRecords
            ]
        ]);
    }

    private function getAttendanceRecords(string $userId, ?string $classId = null)
    {
        return DB::table('attendances as a')
            ->join('class_sessions as cs', 'a.class_session_id', '=', 'cs.id')
            ->join('classes as c', 'cs.class_id', '=', 'c.id')
            ->join('class_schedules as csc', 'cs.class_schedule_id', '=', 'csc.id')
            ->join('users as u', 'c.user_id', '=', 'u.id')
            ->join('locations as l', 'c.location_id', '=', 'l.id')
            ->select([
                'a.id as attendance_id',
                'a.status',
                'a.checked_in_at',
                'c.id as class_id',
                'c.name as class_name',
                'u.name as teacher_name',
                'l.name as location',
                'cs.session_date as date',
                'csc.day_of_week',
                'csc.start_time',
                'csc.end_time'
            ])
            ->where('a.user_id', $userId)
            ->when($classId, fn($query) => $query->where('c.id', $classId))
            ->orderBy('cs.session_date', 'desc')
            ->orderBy('csc.start_time', 'desc')
            ->get();
    }

    private function calculateAttendancePercentage($attendanceRecords): int
    {
        $totalSessions = $attendanceRecords->count();

        if ($totalSessions === 0) {
            return 0;
        }

        $presentSessions = $attendanceRecords->whereNotIn('status', ['absent'])->count();

        return round(($presentSessions / $totalSessions) * 100);
    }

    private function formatAttendanceRecordsByClass($attendanceRecords): array
    {
        $groupedRecords = $attendanceRecords->groupBy('class_id');

        return $groupedRecords->map(function ($classRecords, $classId) {
            $firstRecord = $classRecords->first();
            $attendancePercentage = $this->calculateAttendancePercentage($classRecords);

            $sessions = $classRecords->map(function ($record) {
                return [
                    'date' => $record->date,
                    'day_of_week' => ucfirst($record->day_of_week),
                    'time' => $this->formatTime($record->start_time, $record->end_time),
                    'status' => $record->status,
                    // 'checked_in_at' => $this->formatCheckedInTime($record->checked_in_at),
                ];
            })->values()->toArray();

            return [
                'class_name' => $firstRecord->class_name,
                'attendance_percentage' => $attendancePercentage,
                // 'attendance_id' => $firstRecord->attendance_id,
                'class_id' => $firstRecord->class_id,
                'teacher_name' => $firstRecord->teacher_name,
                'location' => $firstRecord->location,
                'sessions' => $sessions
            ];
        })->values()->toArray();
    }

    private function formatTime(string $startTime, string $endTime): string
    {
        return Carbon::parse($startTime)->format('H:i') . ' - ' . Carbon::parse($endTime)->format('H:i');
    }
}
