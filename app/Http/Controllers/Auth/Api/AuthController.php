<?php

namespace App\Http\Controllers\Auth\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ClassModel;
use App\Exceptions\MessageError;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'              => 'required|string|max:255',
            'email'             => 'required|email',
            'password'          => 'required|string|confirmed|min:6',
            'registration_code' => 'required|string',
        ]);

        $class = ClassModel::where('registration_code', $data['registration_code'])->first();
        if (!$class) {
            throw new MessageError('Class not found from provided registration code.');
        }

        $class->registration_code_expires_at && now()->gt($class->registration_code_expires_at)
            && throw new MessageError('Registration code has expired.');

        $class->max_students && $class->students()->count() >= $class->max_students
            && throw new MessageError('Class is full. Cannot enroll more students.');

        $existingUser = User::where('email', $data['email'])->first();

        if ($existingUser) {
            $class->students()->where('users.id', $existingUser->id)->exists()
                && throw new MessageError('User already enrolled in this class.');

            throw new MessageError('User already registered with this email but not enrolled in this class.');
        }

        $user = User::create([
            'id'       => Str::uuid(),
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => bcrypt($data['password']),
            'role'     => 'student',
        ]);

        $class->students()->attach($user->id);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'message' => 'Student registered and enrolled successfully',
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'token'   => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw new MessageError('Invalid credentials.');
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
            'token'   => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            throw new MessageError('User not authenticated.');
        }

        $user->tokens()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
