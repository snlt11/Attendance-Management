<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SubjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Subject::query()
            ->withCount(['classes']) // Remove students count if relationship doesn't exist yet
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name');

        $subjects = $query->paginate(12)->withQueryString();

        return Inertia::render('subjects', [
            'subjects' => $subjects,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Subjects/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:subjects,name',
        ], [
            'name.required' => 'Subject name is required.',
            'name.unique' => 'A subject with this name already exists.',
            'name.max' => 'Subject name cannot exceed 100 characters.',
        ]);

        $validated['id'] = Str::uuid();

        Subject::create($validated);

        return redirect()->route('subjects.index')
            ->with('success', "Subject '{$validated['name']}' created successfully!");
    }

    /**
     * Display the specified resource.
     */
    public function show(Subject $subject)
    {
        $subject->loadCount(['classes']);
        
        return Inertia::render('Subjects/Show', [
            'subject' => $subject,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Subject $subject)
    {
        return Inertia::render('Subjects/Edit', [
            'subject' => $subject,
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
                Rule::unique('subjects', 'name')->ignore($subject->id),
            ],
        ], [
            'name.required' => 'Subject name is required.',
            'name.unique' => 'A subject with this name already exists.',
            'name.max' => 'Subject name cannot exceed 100 characters.',
        ]);

        $oldName = $subject->name;
        $subject->update($validated);

        return redirect()->route('subjects.index')
            ->with('success', "Subject '{$oldName}' updated to '{$validated['name']}' successfully!");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Subject $subject)
    {
        $subjectName = $subject->name;
        
        // Check if subject has associated classes
        if ($subject->classes()->exists()) {
            return redirect()->route('subjects.index')
                ->with('error', "Cannot delete '{$subjectName}' because it has associated classes.");
        }

        $subject->delete();

        return redirect()->route('subjects.index')
            ->with('success', "Subject '{$subjectName}' deleted successfully!");
    }

    /**
     * Get subjects for API/AJAX requests
     */
    public function api(Request $request)
    {
        $query = Subject::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name');

        return response()->json($query->get());
    }
}
