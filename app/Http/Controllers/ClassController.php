<?php

namespace App\Http\Controllers;

use App\Helpers\Helper;
use App\Models\ClassModel;
use App\Models\ClassSchedule;
use App\Models\Location;
use App\Models\Subject;
use App\Models\User;
use App\Models\ClassStudent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Str;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = ClassModel::with(['subject', 'teacher', 'location', 'schedules'])
                ->withCount('students as enrolled_students_count')  // Add this line
                ->when($request->search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->whereHas('subject', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
                        })->orWhereHas('teacher', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
                        })->orWhere('name', 'like', "%{$search}%");
                    });
                })
                ->latest();

            $classes = $query->paginate(9)->withQueryString();

            // Transform classes to include schedule info for frontend compatibility
            $classes->getCollection()->transform(function ($class) {
                // Get the first schedule for display (you can modify this logic)
                $firstSchedule = $class->schedules->first();
                $class->start_time = $firstSchedule ? $firstSchedule->start_time : '';
                $class->end_time = $firstSchedule ? $firstSchedule->end_time : '';
                $class->day_of_week = $firstSchedule ? $firstSchedule->day_of_week : '';

                // Add schedules array for full schedule info
                $class->class_schedules = $class->schedules->map(function ($schedule) {
                    return [
                        'id' => $schedule->id,
                        'day_of_week' => $schedule->day_of_week,
                        'start_time' => $schedule->start_time,
                        'end_time' => $schedule->end_time,
                    ];
                });

                return $class;
            });

            if ($request->wantsJson()) {
                return response()->json($classes);
            }

            return Inertia::render('classes', [
                'classes' => $classes,
                'filters' => $request->only(['search']),
                'subjects' => Subject::orderBy('name')->get(['id', 'name', 'code']),
                'users' => User::where('role', 'teacher')->orderBy('name')->get(['id', 'name']),
                'locations' => Location::orderBy('name')->get(['id', 'name'])
            ]);
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Failed to load classes', 'error' => $e->getMessage()], 500);
            }
            throw $e;
        }
    }

    public function store(Request $request)
    {
        try {
            // First validate user exists and is a teacher
            $teacher = User::where('id', $request->user_id)
                ->where('role', 'teacher')
                ->firstOrFail();

            // Validate all fields including schedules
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'subject_id' => 'required|exists:subjects,id',
                'user_id' => 'required|exists:users,id',
                'location_id' => 'required|exists:locations,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'max_students' => 'nullable|integer|min:1',
                'schedules' => 'required|array|min:1',
                'schedules.*.day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
                'schedules.*.start_time' => 'required|date_format:H:i',
                'schedules.*.end_time' => 'required|date_format:H:i|after:schedules.*.start_time',
            ]);

            DB::beginTransaction();

            // Check for scheduling conflicts
            foreach ($validated['schedules'] as $schedule) {
                $conflictingClass = ClassSchedule::with(['class.subject', 'class.teacher'])
                    ->whereHas('class', function ($query) use ($validated) {
                        $query->where('user_id', $validated['user_id']);
                    })
                    ->where('day_of_week', $schedule['day_of_week'])
                    ->where(function ($query) use ($schedule) {
                        $query->where(function ($q) use ($schedule) {
                            $q->where('start_time', '<=', $schedule['start_time'])
                                ->where('end_time', '>', $schedule['start_time']);
                        })->orWhere(function ($q) use ($schedule) {
                            $q->where('start_time', '<', $schedule['end_time'])
                                ->where('end_time', '>=', $schedule['end_time']);
                        });
                    })
                    ->first();

                if ($conflictingClass) {
                    $conflictMessage = sprintf(
                        'The teacher already has a class "%s" scheduled on %s from %s to %s.',
                        $conflictingClass->class->subject->name,
                        ucfirst($schedule['day_of_week']),
                        date('g:i A', strtotime($schedule['start_time'])),
                        date('g:i A', strtotime($schedule['end_time']))
                    );

                    return response()->json([
                        'message' => 'Failed to create class',
                        'errors' => ['schedules' => [$conflictMessage]]
                    ], 422);
                }
            }

            // Generate registration code
            $registration_code = Helper::generate();
            $validated['registration_code'] = $registration_code;
            logger()->info('Generated registration code: ' . $registration_code);
            logger()->info('Validated data: ', $validated);

            // Create the class
            $class = ClassModel::create([
                'name' => $validated['name'],
                'description' => $validated['description'],
                'subject_id' => $validated['subject_id'],
                'user_id' => $validated['user_id'],
                'location_id' => $validated['location_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'max_students' => $validated['max_students'] ?? 30,
                'registration_code' => $registration_code,
                'status' => 'active',
            ]);

            // Create schedules
            foreach ($validated['schedules'] as $schedule) {
                $class->schedules()->create([
                    'day_of_week' => $schedule['day_of_week'],
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time'],
                ]);
            }

            DB::commit();

            // Load relationships and transform for frontend
            $class->load(['subject', 'teacher', 'location', 'schedules']);
            $firstSchedule = $class->schedules->first();
            $class->start_time = $firstSchedule ? $firstSchedule->start_time : '';
            $class->end_time = $firstSchedule ? $firstSchedule->end_time : '';
            $class->day_of_week = $firstSchedule ? $firstSchedule->day_of_week : '';
            $class->class_schedules = $class->schedules;

            return response()->json([
                'message' => 'Class created successfully',
                'class' => $class
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create class',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create class',
                'errors' => ['user_id' => ['Selected teacher not found or is not a teacher.']]
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Class creation failed: ' . $e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create class',
                'errors' => ['general' => ['An unexpected error occurred. Please try again.']]
            ], 500);
        }
    }

    public function update(Request $request, ClassModel $class)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'subject_id' => 'required|exists:subjects,id',
                'user_id' => 'required|exists:users,id',
                'location_id' => 'required|exists:locations,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'max_students' => 'nullable|integer|min:1',
                'schedules' => 'required|array|min:1',
                'schedules.*.day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
                'schedules.*.start_time' => 'required|date_format:H:i',
                'schedules.*.end_time' => 'required|date_format:H:i|after:schedules.*.start_time',
            ]);

            DB::beginTransaction();

            // Check for scheduling conflicts (excluding current class)
            foreach ($validated['schedules'] as $schedule) {
                $conflictingClass = ClassSchedule::with(['class.subject', 'class.teacher'])
                    ->whereHas('class', function ($query) use ($validated, $class) {
                        $query->where('user_id', $validated['user_id'])
                            ->where('id', '!=', $class->id);
                    })
                    ->where('day_of_week', $schedule['day_of_week'])
                    ->where(function ($query) use ($schedule) {
                        $query->where(function ($q) use ($schedule) {
                            $q->where('start_time', '<=', $schedule['start_time'])
                                ->where('end_time', '>', $schedule['start_time']);
                        })->orWhere(function ($q) use ($schedule) {
                            $q->where('start_time', '<', $schedule['end_time'])
                                ->where('end_time', '>=', $schedule['end_time']);
                        });
                    })
                    ->first();

                if ($conflictingClass) {
                    $conflictMessage = sprintf(
                        'The teacher already has a class "%s" scheduled on %s from %s to %s.',
                        $conflictingClass->class->subject->name,
                        ucfirst($schedule['day_of_week']),
                        date('g:i A', strtotime($schedule['start_time'])),
                        date('g:i A', strtotime($schedule['end_time']))
                    );

                    return response()->json([
                        'message' => 'Failed to update class',
                        'errors' => ['schedules' => [$conflictMessage]]
                    ], 422);
                }
            }

            // Update class
            $class->update([
                'name' => $validated['name'],
                'description' => $validated['description'],
                'subject_id' => $validated['subject_id'],
                'user_id' => $validated['user_id'],
                'location_id' => $validated['location_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'max_students' => $validated['max_students'] ?? 30,
            ]);

            // Delete existing schedules and create new ones
            $class->schedules()->delete();
            foreach ($validated['schedules'] as $schedule) {
                $class->schedules()->create([
                    'day_of_week' => $schedule['day_of_week'],
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time'],
                ]);
            }

            DB::commit();

            // Load relationships and transform for frontend
            $class->load(['subject', 'teacher', 'location', 'schedules']);
            $firstSchedule = $class->schedules->first();
            $class->start_time = $firstSchedule ? $firstSchedule->start_time : '';
            $class->end_time = $firstSchedule ? $firstSchedule->end_time : '';
            $class->day_of_week = $firstSchedule ? $firstSchedule->day_of_week : '';
            $class->class_schedules = $class->schedules;

            return response()->json([
                'message' => 'Class updated successfully',
                'class' => $class
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update class',
                'errors' => $e instanceof \Illuminate\Validation\ValidationException ? $e->errors() : ['general' => [$e->getMessage()]]
            ], $e instanceof \Illuminate\Validation\ValidationException ? 422 : 500);
        }
    }

    public function destroy(ClassModel $class)
    {
        try {
            DB::beginTransaction();

            // Delete attendances first
            $class->sessions()->each(function ($session) {
                DB::table('attendances')->where('class_session_id', $session->id)->delete();
            });

            // Delete sessions
            $class->sessions()->delete();

            // Delete schedules
            $class->schedules()->delete();

            // Delete student enrollments
            DB::table('class_students')->where('class_id', $class->id)->delete();

            // Delete the class
            $class->forceDelete();

            DB::commit();

            return response()->json([
                'message' => 'Class deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Class deletion failed: ' . $e->getMessage(), [
                'class_id' => $class->id,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to delete class',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateQR(ClassModel $class)
    {
        try {
            DB::beginTransaction();

            // Get today with myanmar timezone
            $today = now()->setTimezone('Asia/Yangon')->format('l'); //Full day name (Monday, Tuesday, etc.)

            $todaySchedule = $class->schedules()
                ->where('day_of_week', strtolower($today))
                ->first();

            if (!$todaySchedule) {
                return response()->json([
                    'message' => 'No class scheduled for today',
                    'error' => 'This class is not scheduled to run today.'
                ], 422);
            }

            $today = now()->toDateString();

            // Use whereDate to compare only the date part, ignoring time
            $session = $class->sessions()->whereDate('session_date', $today)->first();

            $token = Str::random(32);
            $expiresAt = now()->addMinutes(5)->setTimezone('Asia/Yangon');

            if ($session) {
                $session->update([
                    'class_schedule_id' => $todaySchedule->id,
                    'start_time' => $todaySchedule->start_time,
                    'end_time' => $todaySchedule->end_time,
                    'qr_token' => $token,
                    'expires_at' => $expiresAt,
                    'status' => 'active'
                ]);
            } else {
                $session = $class->sessions()->create([
                    'class_schedule_id' => $todaySchedule->id,
                    'session_date' => $today,
                    'start_time' => $todaySchedule->start_time,
                    'end_time' => $todaySchedule->end_time,
                    'status' => 'active',
                    'qr_token' => $token,
                    'expires_at' => $expiresAt,
                ]);
            }

            DB::commit();

            return response()->json([
                'qr_token' => $token,
                'expires_at' => $expiresAt,
                'message' => 'QR code generated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('QR generation failed: ' . $e->getMessage(), [
                'class_id' => $class->id,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to generate QR code',
                'error' => app()->environment('local') ? $e->getMessage() : 'An unexpected error occurred. Please try again.'
            ], 500);
        }
    }

    public function getStudents(ClassModel $class)
    {
        try {
            $students = $class->students()->get(['users.id', 'users.name', 'users.email']);
            $all_students = User::where('role', 'student')->orderBy('name')->get(['id', 'name', 'email']);

            // Calculate attendance percentage for each student for the full class period
            $startDate = $class->start_date;
            $endDate = $class->end_date;
            $totalSessions = $class->sessions()
                ->where('session_date', '>=', $startDate)
                ->where('session_date', '<=', $endDate)
                ->count();

            $students = $students->map(function ($student) use ($class, $startDate, $endDate, $totalSessions) {
                $attendedSessions = $class->sessions()
                    ->whereHas('attendances', function ($query) use ($student) {
                        $query->where('user_id', $student->id)
                            ->where('status', 'present');
                    })
                    ->where('session_date', '>=', $startDate)
                    ->where('session_date', '<=', $endDate)
                    ->count();

                $attendance_percentage = $totalSessions > 0
                    ? round(($attendedSessions / $totalSessions) * 100, 2)
                    : 0;

                $student->attendance_percentage = $attendance_percentage;
                return $student;
            });

            return response()->json([
                'students' => $students,
                'all_students' => $all_students,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to get students for class ' . $class->id . ': ' . $e->getMessage());
            return response()->json(['message' => 'Failed to load class details.'], 500);
        }
    }

    public function addStudent(Request $request, ClassModel $class)
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
            ]);

            $user = User::find($validated['user_id']);
            if ($user->role !== 'student') {
                return response()->json(['message' => 'Selected user is not a student.'], 422);
            }

            if ($class->students()->where('users.id', $validated['user_id'])->exists()) {
                return response()->json(['message' => 'Student is already enrolled in this class.'], 422);
            }

            $class->students()->attach($validated['user_id']);

            $newStudent = User::find($validated['user_id']);

            return response()->json([
                'message' => 'Student added successfully.',
                'student' => [
                    'id' => $newStudent->id,
                    'name' => $newStudent->name,
                    'email' => $newStudent->email
                ]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Failed to add student to class ' . $class->id . ': ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function removeStudent(ClassModel $class, User $user)
    {
        try {
            if ($user->role !== 'student') {
                return response()->json(['message' => 'Selected user is not a student.'], 422);
            }

            if (!$class->students()->where('users.id', $user->id)->exists()) {
                return response()->json(['message' => 'Student is not enrolled in this class.'], 404);
            }

            $class->students()->detach($user->id);

            return response()->json(['message' => 'Student removed successfully.']);
        } catch (\Exception $e) {
            logger()->error('Failed to remove student from class ' . $class->id . ': ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function searchAvailableStudents(ClassModel $class, Request $request)
    {
        try {
            $search = $request->get('search', '');

            $enrolledStudentIds = $class->students()->pluck('users.id');

            $query = User::where('role', 'student')
                ->whereNotIn('id', $enrolledStudentIds)
                ->orderBy('name');

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', '%' . $search . '%')
                        ->orWhere('email', 'LIKE', '%' . $search . '%');
                });
            }

            $students = $query->limit(100)->get(['id', 'name', 'email']);

            return response()->json([
                'students' => $students
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to search available students for class ' . $class->id . ': ' . $e->getMessage());
            return response()->json(['message' => 'Failed to search students.'], 500);
        }
    }

    public function generateClassCode(ClassModel $class)
    {
        try {
            DB::beginTransaction();

            $newCode = Helper::generate();
            $expiresAt = now()->addDays(30);

            $class->update([
                'registration_code' => $newCode,
                'registration_code_expires_at' => $expiresAt
            ]);

            DB::commit();

            return response()->json([
                'message' => 'New class code generated successfully',
                'registration_code' => $newCode,
                'expires_at' => $expiresAt->toISOString()
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to generate class code for class ' . $class->id . ': ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to generate new class code.',
                'error' => app()->environment('local') ? $e->getMessage() : 'An unexpected error occurred.'
            ], 500);
        }
    }
}
