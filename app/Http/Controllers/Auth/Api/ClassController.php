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
            ], 403);
        }

        $request->validate([
            'history' => 'boolean',
            'current' => 'boolean',
        ]);

        return match (true) {
            $request->has('history') => $this->getClassHistory(),
            default => $this->getCurrentClass(),
        };
    }

    private function getClassHistory()
    {
        $pastClasses = $this->fetchClassesByDateFilter('past');

        return response()->json([
            'success' => true,
            'data' => [
                'past_classes' => $pastClasses
            ]
        ]);
    }

    private function getCurrentClass()
    {
        $currentClasses = $this->fetchClassesByDateFilter('current');

        return response()->json([
            'success' => true,
            'data' => [
                'current_classes' => $currentClasses
            ]
        ]);
    }

    private function fetchClassesByDateFilter(string $filter)
    {
        $userId = Auth::id();
        $today = Carbon::today()->format('Y-m-d');

        // Build base query with optimized joins
        $query = DB::table('class_students as cs')
            ->join('classes as c', 'cs.class_id', '=', 'c.id')
            ->join('users as u', 'c.user_id', '=', 'u.id')
            ->join('locations as l', 'c.location_id', '=', 'l.id')
            ->join('class_schedules as csc', 'c.id', '=', 'csc.class_id')
            ->select([
                'c.id as class_id',
                'c.name as class_name',
                'u.name as teacher',
                'l.name as location',
                'csc.start_time',
                'csc.end_time',
                'csc.day_of_week',
                'c.start_date',
                'c.end_date'
            ])
            ->where('cs.user_id', $userId);

        // Apply date filter at database level for better performance
        if ($filter === 'past') {
            $query->where('c.end_date', '<', $today)
                ->orderBy('c.end_date', 'desc');
        } else {
            $query->where('c.end_date', '>=', $today)
                ->orderBy('c.start_date', 'asc');
        }

        $rawClasses = $query->get();

        // Format the data using Collection methods
        return collect($rawClasses)->map(function ($class) {
            return [
                'class_id' => $class->class_id,
                'class_name' => $class->class_name,
                'teacher' => $class->teacher,
                'location' => $class->location,
                'time' => $this->formatTime($class->start_time, $class->end_time),
                'day_of_week' => ucfirst($class->day_of_week),
                'start_date' => $class->start_date,
                'end_date' => $class->end_date
            ];
        })->values()->toArray();
    }

    private function formatTime(string $startTime, string $endTime): string
    {
        return Carbon::parse($startTime)->format('H:i') . ' - ' . Carbon::parse($endTime)->format('H:i');
    }
}
