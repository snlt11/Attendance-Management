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
        // Check if subject has related classes
        $classCount = $subject->classes()->count();
        if ($classCount > 0) {
            $classText = $classCount === 1 ? 'class' : 'classes';
            return response()->json([
                'success' => false,
                'message' => "Cannot delete '{$subject->name}' because it has {$classCount} associated {$classText}. Please remove the classes using this subject first or assign them to a different subject.",
                'suggestion' => 'reassign_or_remove_classes'
            ], 422);
        }

        try {
            $subject->delete();

            return response()->json([
                'success' => true,
                'message' => 'Subject deleted successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete subject. Please try again or contact support.'
            ], 500);
        }
    }
}
