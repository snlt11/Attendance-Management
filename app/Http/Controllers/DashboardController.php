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

        // Get recent classes with detailed information using raw SQL for better performance
        $recentClasses = DB::select("
            SELECT 
                cs.id,
                s.name as subject,
                CONCAT(u.name) as teacher,
                DATE_FORMAT(cs.start_time, '%H:%i') as start_time,
                DATE_FORMAT(cs.end_time, '%H:%i') as end_time,
                CONCAT(DATE_FORMAT(cs.start_time, '%H:%i'), ' - ', DATE_FORMAT(cs.end_time, '%H:%i')) as time,
                l.name as location,
                cs.status,
                c.max_students as capacity,
                COALESCE(attendance_count.attendees, 0) as attendees,
                cs.session_date
            FROM class_sessions cs
            JOIN classes c ON cs.class_id = c.id
            JOIN subjects s ON c.subject_id = s.id
            JOIN users u ON c.user_id = u.id
            JOIN locations l ON c.location_id = l.id
            LEFT JOIN (
                SELECT 
                    class_session_id,
                    COUNT(*) as attendees
                FROM attendances 
                WHERE status = 'present'
                GROUP BY class_session_id
            ) attendance_count ON cs.id = attendance_count.class_session_id
            WHERE cs.session_date >= CURDATE() - INTERVAL 1 DAY
            ORDER BY cs.session_date DESC, cs.start_time DESC
            LIMIT 20
        ");

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
            'studentGrowth' => $studentGrowth
        ];

        // Format recent classes data to match frontend expectations
        $formattedRecentClasses = collect($recentClasses)->map(function ($class) {
            return [
                'id' => $class->id,
                'subject' => $class->subject,
                'teacher' => $class->teacher,
                'time' => $class->time,
                'location' => $class->location,
                'attendees' => (int) $class->attendees,
                'capacity' => (int) $class->capacity,
                'status' => $this->mapSessionStatus($class->status, $class->start_time, $class->end_time, $class->session_date)
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
        $sessionStart = Carbon::parse($sessionDate . ' ' . $startTime);
        $sessionEnd = Carbon::parse($sessionDate . ' ' . $endTime);

        if ($now->isBefore($sessionStart)) {
            return 'upcoming';
        } elseif ($now->isBetween($sessionStart, $sessionEnd)) {
            return 'ongoing';
        } else {
            return 'completed';
        }
    }
}
