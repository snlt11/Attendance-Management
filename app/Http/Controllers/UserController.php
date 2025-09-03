<?php

namespace App\Http\Controllers;

use App\Helpers\Helper;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        $users = User::all();
        return inertia('users', [
            'users' => $users,
            'auth' => [
                'user' => Auth::user(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'role' => ['required', Rule::in(['teacher', 'student'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'address' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'password' => [
                'required',
                'string',
                Rule::password()->min(8)
                    ->mixedCase()   // requires uppercase + lowercase
                    ->letters()     // at least one letter
                    ->numbers()     // at least one number
                    ->symbols()     // at least one special character
            ],
        ]);

        $user = User::create($validated);
        // $password = Helper::generate();
        logger("Creating user with email: {$validated['email']}");
        $validated['password'] = bcrypt($validated['password']);

        return response()->json([
            'success' => true,
            'user' => $user,
            'message' => 'User created successfully'
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
            'role' => ['required', Rule::in(['teacher', 'student'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'address' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'user' => $user,
            'message' => 'User updated successfully'
        ]);
    }

    public function destroy(User $user)
    {
        // Check if user has related records that would prevent deletion
        $relatedData = [];

        // Check if user is a teacher with classes
        $classesAsTeacher = DB::table('classes')->where('user_id', $user->id)->count();
        if ($classesAsTeacher > 0) {
            $relatedData[] = "{$classesAsTeacher} class(es) as teacher";
        }

        // Check if user is a student enrolled in classes
        $classesAsStudent = DB::table('class_students')->where('user_id', $user->id)->count();
        if ($classesAsStudent > 0) {
            $relatedData[] = "{$classesAsStudent} class enrollment(s) as student";
        }

        // Check if user has attendance records
        $attendanceRecords = DB::table('attendances')->where('user_id', $user->id)->count();
        if ($attendanceRecords > 0) {
            $relatedData[] = "{$attendanceRecords} attendance record(s)";
        }

        // If there are related records, prevent deletion
        if (!empty($relatedData)) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete user. This user has related data: ' . implode(', ', $relatedData) . '. Please remove these associations first or set the user status to "Inactive" instead of deleting.',
                'suggestion' => 'suspend'
            ], 422);
        }

        try {
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user. Please try again or contact support.'
            ], 500);
        }
    }
}
