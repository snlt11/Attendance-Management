<?php

namespace App\Http\Controllers;

use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $query = ClassModel::with(['subject', 'teacher'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('subject', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })->orWhereHas('teacher', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            });

        $classes = $query->paginate(10)->withQueryString();

        return Inertia::render('classes', [
            'classes' => $classes,
            'filters' => $request->only(['search']),
            'subjects' => Subject::all(),
            'teachers' => User::where('role', 'teacher')->get(['id', 'name']) // Assuming you have a role field
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:users,id',
            'start_time' => 'required|date_format:G:i', // Changed to accept single digit hours
            'end_time' => 'required|date_format:G:i|after:start_time',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        ClassModel::create($validated);

        return redirect()->back()->with('success', 'Class created successfully.');
    }

    public function update(Request $request, ClassModel $class)
    {
        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:users,id',
            'start_time' => 'required|date_format:G:i',
            'end_time' => 'required|date_format:G:i|after:start_time',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $class->update($validated);

        return redirect()->back()->with('success', 'Class updated successfully.');
    }

    public function destroy(ClassModel $class)
    {
        $class->delete();

        return redirect()->back()->with('success', 'Class deleted successfully.');
    }

    public function generateQR(ClassModel $class)
    {
        $session = $class->sessions()->create([
            'session_date' => now()->toDateString(),
            'qr_token' => Str::random(32),
            'expires_at' => now()->addHours(24)
        ]);

        return response()->json([
            'qr_token' => $session->qr_token,
            'expires_at' => $session->expires_at
        ]);
    }
}
