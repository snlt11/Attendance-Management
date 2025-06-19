<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SubjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return inertia('subjects', [
            'subjects' => Subject::orderBy('name')->get()
        ]);
    }

    /**
     * Get subjects for API/AJAX requests
     */
    // public function list()
    // {
    //     $subjects = Subject::orderBy('name')->get();
    //     return response()->json([
    //         'success' => true,
    //         'subjects' => $subjects
    //     ]);
    // }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:subjects,name',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
        ], [
            'name.required' => 'Subject name is required.',
            'name.unique' => 'A subject with this name already exists.',
            'name.max' => 'Subject name cannot exceed 100 characters.',
        ]);

        $subject = Subject::create($validated);

        return response()->json([
            'success' => true,
            'subject' => $subject,
            'message' => 'Subject created successfully!'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('subjects', 'name')->ignore($subject->id)
            ],
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
        ], [
            'name.required' => 'Subject name is required.',
            'name.unique' => 'A subject with this name already exists.',
            'name.max' => 'Subject name cannot exceed 100 characters.',
        ]);

        $subject->update($validated);

        return response()->json([
            'success' => true,
            'subject' => $subject,
            'message' => 'Subject updated successfully!'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Subject $subject)
    {
        if ($subject->classes()->exists()) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete subject because it has associated classes."
            ], 422);
        }

        $subject->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subject deleted successfully!'
        ]);
    }
}
