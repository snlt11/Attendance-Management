<?php

namespace App\Http\Controllers\Auth\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ClassModel;
use App\Exceptions\MessageError;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'              => 'required|string|max:255',
            'email'             => 'required|email',
            'password'          => [
                'required',
                'string',
                'confirmed',
                Rules\Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
            'registration_code' => 'required|string',
        ]);

        $class = ClassModel::where('registration_code', $data['registration_code'])->first();

        if (!$class) {
            throw new MessageError('Class not found from provided registration code.', 404);
        }


        if ($class->registration_code_expires_at && now()->gt($class->registration_code_expires_at)) {
            throw new MessageError('Registration code has expired.', 410);
        }

        if ($class->max_students && $class->students()->count() >= $class->max_students) {
            throw new MessageError('Class is full. Cannot enroll more students.', 409);
        }

        $existingUser = User::where('email', $data['email'])->first();


        if ($existingUser) {
            if ($class->students()->where('users.id', $existingUser->id)->exists()) {
                throw new MessageError('User already enrolled in this class.', 409);
            }
            throw new MessageError('User already registered with this email but not enrolled in this class.', 409);
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
            'password' => [
                'required',
                'string',
                'min:8',
            ],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw new MessageError('Invalid credentials.', 401);
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
        ], 200);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            throw new MessageError('User not authenticated.', 401);
        }

        $user->tokens()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
