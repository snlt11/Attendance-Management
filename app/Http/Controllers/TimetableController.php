<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TimetableController extends Controller
{
    /**
     * Handle the incoming request.
     * 
     * Optional Query Parameters:
     * - class_id: If provided, returns timetable for only that specific class.
     *            If not provided, returns timetable for all classes the user has access to.
     * 
     * Access Control:
     * - Students: Can only see classes they are enrolled in
     * - Teachers: Can only see classes they are teaching
     */
    public function __invoke(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized. Only authenticated users can access timetable information.'
            ], 401);
        }


        // Get optional class_id parameter
        $classId = $request->query('class_id');

        // Get classes that the user is enrolled in (for students) or teaching (for teachers)
        $query = DB::table('classes as c')
            ->join('class_schedules as cs', 'c.id', '=', 'cs.class_id')
            ->select([
                'c.id as class_id',
                'c.name as class_name',
                'c.start_date as from_date',
                'c.end_date as to_date',
                'cs.day_of_week'
            ])
            ->where('c.status', 'active');

        // Apply role-based filtering and optional class_id filter
        if ($classId) $query->where('c.id', $classId);


        match ($user->role) {
            'student' => $query->join('class_students as cst', 'c.id', '=', 'cst.class_id')
                ->where('cst.user_id', $user->id),
            'teacher' => $query->where('c.user_id', $user->id),
            default => null
        };

        $classes = $query->get();

        // Group classes by class_id and generate timetable entries
        $timetableEntries = collect($classes)
            ->groupBy('class_id')
            ->map(function ($classSchedules, $classId) {
                $firstClass = $classSchedules->first();
                $uniqueDays = $classSchedules->pluck('day_of_week')->unique();

                $allClassDates = $uniqueDays
                    ->flatMap(fn($day) => $this->generateClassDates(
                        $firstClass->from_date,
                        $firstClass->to_date,
                        $day
                    ))
                    ->unique()
                    ->sort()
                    ->values();

                return [
                    'class_id' => $firstClass->class_id,
                    'class_name' => $firstClass->class_name,
                    'dates' => $allClassDates->toArray()
                ];
            })
            ->values();

        return response()->json(['success' => true, 'data' => $timetableEntries]);
    }

    /**
     * Generate list of dates between from_date and to_date for the specified day of week
     */
    private function generateClassDates($fromDate, $toDate, $dayOfWeek)
    {
        if (!$fromDate || !$toDate) return [];

        $start = Carbon::parse($fromDate);
        $end = Carbon::parse($toDate);

        // Map day names to Carbon constants
        $dayMapping = [
            'monday' => Carbon::MONDAY,
            'tuesday' => Carbon::TUESDAY,
            'wednesday' => Carbon::WEDNESDAY,
            'thursday' => Carbon::THURSDAY,
            'friday' => Carbon::FRIDAY,
            'saturday' => Carbon::SATURDAY,
            'sunday' => Carbon::SUNDAY
        ];

        $targetDayOfWeek = $dayMapping[$dayOfWeek] ?? null;

        if (!$targetDayOfWeek) return [];

        // Find the first occurrence of the target day within the range
        $firstOccurrence = $start->copy()->next($targetDayOfWeek);

        // If the first occurrence is after our end date, no dates exist
        if ($firstOccurrence->gt($end)) return [];

        // Generate all dates using Carbon's period functionality
        return collect()
            ->times($firstOccurrence->diffInWeeks($end) + 1)
            ->map(fn($week) => $firstOccurrence->copy()->addWeeks($week - 1)->format('Y-m-d'))
            ->filter(fn($date) => Carbon::parse($date)->between($start, $end))
            ->values()
            ->toArray();
    }
}
