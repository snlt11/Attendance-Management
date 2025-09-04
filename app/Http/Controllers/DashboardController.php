<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        // Get total students count
        $totalStudents = DB::table('users')
            ->where('role', 'student')
            ->where('status', 'active')
            ->count();

        //Get total subject count
        $totalSubjects = DB::table('subjects')
            ->count();

        // Get total active classes
        $totalClasses = DB::table('classes')
            ->where('status', 'active')
            ->count();

        // Get total locations
        $totalLocations = DB::table('locations')->count();

        // Get today's attendance data
        $today = Carbon::today();
        $todayAttendance = DB::table('attendances')
            ->join('class_sessions', 'attendances.class_session_id', '=', 'class_sessions.id')
            ->where('class_sessions.session_date', $today)
            ->where('attendances.status', 'present')
            ->count();

        // Calculate attendance rate for today
        $totalExpectedStudentsToday = DB::table('class_sessions')
            ->join('classes', 'class_sessions.class_id', '=', 'classes.id')
            ->join('class_students', 'classes.id', '=', 'class_students.class_id')
            ->where('class_sessions.session_date', $today)
            ->count();

        $attendanceRate = $totalExpectedStudentsToday > 0
            ? round(($todayAttendance / $totalExpectedStudentsToday) * 100, 1)
            : 0;

        // Get active classes count for today
        $activeClassesToday = DB::table('class_sessions')
            ->where('session_date', $today)
            ->where('status', 'active')
            ->count();

        // Get recent classes with detailed information using Laravel Query Builder for better compatibility
        $recentClasses = DB::table('class_sessions as cs')
            ->join('classes as c', 'cs.class_id', '=', 'c.id')
            ->join('subjects as s', 'c.subject_id', '=', 's.id')
            ->join('users as u', 'c.user_id', '=', 'u.id')
            ->join('locations as l', 'c.location_id', '=', 'l.id')
            ->leftJoin(DB::raw('(
                SELECT
                    class_session_id,
                    COUNT(*) as attendees
                FROM attendances
                WHERE status = "present"
                GROUP BY class_session_id
            ) as attendance_count'), 'cs.id', '=', 'attendance_count.class_session_id')
            ->select([
                'cs.id',
                's.name as subject',
                'u.name as teacher',
                'cs.start_time',
                'cs.end_time',
                'l.name as location',
                'cs.status',
                'c.max_students as capacity',
                DB::raw('COALESCE(attendance_count.attendees, 0) as attendees'),
                'cs.session_date'
            ])
            ->whereDate('cs.session_date', '>=', Carbon::yesterday())
            ->orderByDesc('cs.session_date')
            ->orderByDesc('cs.start_time')
            ->limit(20)
            ->get();

        // Calculate growth percentage for students (mock calculation based on assumption)
        $lastMonthStudents = DB::table('users')
            ->where('role', 'student')
            ->where('status', 'active')
            ->where('created_at', '<=', Carbon::now()->subMonth())
            ->count();

        $studentGrowth = $lastMonthStudents > 0
            ? round((($totalStudents - $lastMonthStudents) / $lastMonthStudents) * 100, 1)
            : 0;

        // Prepare stats data
        $stats = [
            'totalStudents' => $totalStudents,
            'totalClasses' => $totalClasses,
            'totalLocations' => $totalLocations,
            'todayAttendance' => $todayAttendance,
            'attendanceRate' => $attendanceRate,
            'activeClasses' => $activeClassesToday,
            'studentGrowth' => $studentGrowth,
            'totalSubjects' => $totalSubjects
        ];

        // Format recent classes data to match frontend expectations
        $formattedRecentClasses = collect($recentClasses)->map(function ($class) {
            // Format time properly for display
            $startTime = Carbon::parse($class->start_time)->format('H:i');
            $endTime = Carbon::parse($class->end_time)->format('H:i');
            $timeRange = $startTime . ' - ' . $endTime;

            return [
                'id' => $class->id,
                'subject' => $class->subject,
                'teacher' => $class->teacher,
                'time' => $timeRange,
                'location' => $class->location,
                'attendees' => (int) $class->attendees,
                'capacity' => (int) $class->capacity,
                'status' => $this->mapSessionStatus($class->status, $startTime, $endTime, $class->session_date)
            ];
        });

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentClasses' => $formattedRecentClasses
        ]);
    }

    /**
     * Map database session status to frontend status based on time
     */
    private function mapSessionStatus($dbStatus, $startTime, $endTime, $sessionDate)
    {
        $now = Carbon::now();

        // Parse session date and times properly
        $sessionDateOnly = Carbon::parse($sessionDate)->format('Y-m-d');
        $sessionStart = Carbon::parse($sessionDateOnly . ' ' . $startTime);
        $sessionEnd = Carbon::parse($sessionDateOnly . ' ' . $endTime);

        if ($now->isBefore($sessionStart)) {
            return 'upcoming';
        } elseif ($now->isBetween($sessionStart, $sessionEnd)) {
            return 'ongoing';
        } else {
            return 'completed';
        }
    }
}
