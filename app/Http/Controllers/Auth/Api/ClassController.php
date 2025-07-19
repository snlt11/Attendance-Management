<?php

namespace App\Http\Controllers\Auth\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ClassController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized. Only authenticated users can access class information.'
            ], 401);
        }

        $request->validate([
            'history' => 'boolean',
            'current' => 'boolean',
        ]);

        $result = match (true) {
            $request->has('history') => [
                'key' => 'history_classes',
                'data' => $this->fetchClassesByDateFilter('history')
            ],
            $request->has('current') => [
                'key' => 'current_classes',
                'data' => $this->fetchClassesByDateFilter('current')
            ],
            default => [
                'key' => 'all_classes',
                'data' => $this->fetchClassesByDateFilter('all')
            ],
        };

        return response()->json([
            'success' => true,
            'data' => [
                $result['key'] => $result['data']
            ]
        ]);
    }

    private function fetchClassesByDateFilter(string $filter)
    {
        $userId = Auth::id();
        $today = Carbon::today()->format('Y-m-d');

        // First get unique classes
        $classQuery = DB::table('class_students as cs')
            ->join('classes as c', 'cs.class_id', '=', 'c.id')
            ->join('users as u', 'c.user_id', '=', 'u.id')
            ->join('locations as l', 'c.location_id', '=', 'l.id')
            ->select([
                'c.id as class_id',
                'c.name as class_name',
                'u.name as teacher',
                'l.name as location',
                'c.start_date',
                'c.end_date'
            ])
            ->where('cs.user_id', $userId);

        // Apply date filter at database level for better performance
        match ($filter) {
            'history' => $classQuery->where('c.end_date', '<', $today)->orderBy('c.end_date', 'desc'),
            'current' => $classQuery->where('c.end_date', '>=', $today)->orderBy('c.start_date', 'asc'),
            default => $classQuery->orderBy('c.start_date', 'asc'),
        };

        $classes = $classQuery->get();

        // Get schedules for each class
        $classIds = $classes->pluck('class_id')->toArray();
        $schedules = DB::table('class_schedules')
            ->whereIn('class_id', $classIds)
            ->get()
            ->groupBy('class_id');

        // Format the data by combining schedules for each class
        return $classes->map(function ($class) use ($schedules) {
            $classSchedules = $schedules->get($class->class_id, collect());

            // Extract unique time slots and days
            $timeSlots = $classSchedules->map(function ($schedule) {
                return $this->formatTime($schedule->start_time, $schedule->end_time);
            })->unique()->implode(', ');

            $daysOfWeek = $classSchedules->map(function ($schedule) {
                return ucfirst($schedule->day_of_week);
            })->implode(', ');

            return [
                'class_id' => $class->class_id,
                'class_name' => $class->class_name,
                'teacher' => $class->teacher,
                'location' => $class->location,
                'time' => $timeSlots ?: 'No schedule',
                'day_of_week' => $daysOfWeek ?: 'No schedule',
                'from_date' => $class->start_date,
                'to_date' => $class->end_date
            ];
        })->values()->toArray();
    }

    private function formatTime(string $startTime, string $endTime): string
    {
        return Carbon::parse($startTime)->format('H:i') . ' - ' . Carbon::parse($endTime)->format('H:i');
    }
}
