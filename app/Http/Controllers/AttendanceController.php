<?php

namespace App\Http\Controllers;

use App\Models\ClassModel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index($classId, $studentId, Request $request)
    {
        $class = ClassModel::findOrFail($classId);
        $student = User::findOrFail($studentId);

        $startDate = Carbon::parse($class->start_date);
        $endDate = Carbon::parse($class->end_date);

        // If class hasn't ended yet, use today's date as end date
        if ($endDate->isFuture()) $onlyForAttendances = Carbon::now();

        $perPage = 12;
        $page = $request->get('page', 1);

        // Get all class sessions between start date and today, with attendance info
        $sessions = $class->sessions()
            ->where('session_date', '>=', $startDate)
            ->where('session_date', '<=', $onlyForAttendances)
            ->with(['attendances' => function ($query) use ($studentId) {
                $query->where('user_id', $studentId);
            }])
            ->orderBy('session_date', 'desc')
            ->paginate($perPage);

        // Transform the data to include attendance status
        $attendances = $sessions->through(function ($session) use ($studentId) {
            $attendance = $session->attendances->first();
            return [
                'id' => $session->id,
                'class_session' => [
                    'id' => $session->id,
                    'session_date' => $session->session_date,
                    'start_time' => $session->start_time,
                    'end_time' => $session->end_time,
                ],
                'checked_in_at' => $attendance ? $attendance->checked_in_at : null,
                'status' => $attendance ? $attendance->status : 'absent'
            ];
        });

        // Calculate total sessions and attended sessions for percentage
        $totalSessions = $class->sessions()
            ->where('session_date', '>=', $startDate)
            ->where('session_date', '<=', $endDate)
            ->count();

        $attendedSessions = $class->sessions()
            ->whereHas('attendances', function ($query) use ($studentId) {
                $query->where('user_id', $studentId)
                    ->whereIn('status', ['present','late']);
            })
            ->where('session_date', '>=', $startDate)
            ->where('session_date', '<=', $endDate)
            ->count();

        $attendancePercentage = $totalSessions > 0
            ? round(($attendedSessions / $totalSessions) * 100, 2)
            : 0;

        return Inertia::render('attendances', [
            'classId' => $classId,
            'className' => $class->name,
            'studentId' => $studentId,
            'studentName' => $student->name,
            'attendances' => $attendances,
            'totalSessions' => $totalSessions,
            'attendedSessions' => $attendedSessions,
            'attendancePercentage' => $attendancePercentage,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
        ]);
    }
}
