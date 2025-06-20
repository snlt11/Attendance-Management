<?php

namespace App\Http\Controllers;

use App\Helpers\Helper;
use App\Models\ClassModel;
use App\Models\Location;
use App\Models\Subject;
use App\Models\User;
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
            $query = ClassModel::with(['subject', 'teacher', 'location'])
                ->when($request->search, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->whereHas('subject', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
                        })->orWhereHas('teacher', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
                        });
                    });
                })
                ->latest();

            $classes = $query->paginate(9)->withQueryString();

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

            // Then validate all other fields
            $validated = $request->validate([
                'subject_id' => 'required|exists:subjects,id',
                'user_id' => 'required|exists:users,id',
                'location_id' => 'required|exists:locations,id',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
            ]);

            // Check for scheduling conflicts with more details
            $conflictingClass = ClassModel::with(['subject', 'teacher'])
                ->where('user_id', $validated['user_id'])
                ->where(function ($query) use ($validated) {
                    $query->where(function ($q) use ($validated) {
                        $q->where('start_time', '<=', $validated['start_time'])
                            ->where('end_time', '>', $validated['start_time']);
                    })->orWhere(function ($q) use ($validated) {
                        $q->where('start_time', '<', $validated['end_time'])
                            ->where('end_time', '>=', $validated['end_time']);
                    });
                })
                ->first();

            if ($conflictingClass) {
                $conflictMessage = sprintf(
                    'The teacher already has a class "%s" scheduled from %s to %s.',
                    $conflictingClass->subject->name,
                    date('g:i A', strtotime($conflictingClass->start_time)),
                    date('g:i A', strtotime($conflictingClass->end_time))
                );

                return response()->json([
                    'message' => 'Failed to create class',
                    'errors' => ['time' => [$conflictMessage]]
                ], 422);
            }
            $registration_code = Helper::generate();
            $validated['registration_code'] = $registration_code;

            // Create the class
            $class = ClassModel::create($validated);

            // Load relationships
            $class->load(['subject', 'teacher', 'location']);

            return response()->json([
                'message' => 'Class created successfully',
                'class' => $class
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Failed to create class',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Failed to create class',
                'errors' => ['user_id' => ['Selected teacher not found or is not a teacher.']]
            ], 422);
        } catch (\Exception $e) {
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
                'subject_id' => 'required|exists:subjects,id',
                'user_id' => 'required|exists:users,id',
                'location_id' => 'required|exists:locations,id',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
            ]);

            $class->update($validated);

            $class->load(['subject', 'teacher', 'location']);

            return response()->json([
                'message' => 'Class updated successfully',
                'class' => $class
            ]);
        } catch (\Exception $e) {
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

            $class->sessions()->each(function ($session) {
                DB::table('attendances')->where('class_session_id', $session->id)->delete();
            });
            $class->sessions()->delete();

            DB::table('class_students')->where('class_id', $class->id)->delete();

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

            try {
                $session = DB::table('class_sessions')
                    ->where('class_id', $class->id)
                    ->where('session_date', now()->toDateString())
                    ->first();

                $token = Str::random(32);
                $expiresAt = now()->addMinutes(5);

                if ($session) {
                    DB::table('class_sessions')
                        ->where('id', $session->id)
                        ->update([
                            'qr_token' => $token,
                            'expires_at' => $expiresAt,
                            'updated_at' => now()
                        ]);
                } else {
                    DB::table('class_sessions')->insert([
                        'id' => Str::uuid(),
                        'class_id' => $class->id,
                        'session_date' => now()->toDateString(),
                        'qr_token' => $token,
                        'expires_at' => $expiresAt,
                        'created_at' => now(),
                        'updated_at' => now()
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
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate QR code',
                'error' => app()->environment('local') ? $e->getMessage() : 'An unexpected error occurred. Please try again.'
            ], 500);
        }
    }
}
