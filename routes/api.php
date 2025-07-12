<?php

use App\Http\Controllers\Auth\Api\AttendanceController;
use App\Http\Controllers\Auth\Api\CheckInAttendanceController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TimetableController;
use App\Http\Controllers\Auth\Api\AuthController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Attendance routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/attendance', AttendanceController::class);
    Route::post('/attendance', CheckInAttendanceController::class);
    Route::get('/time-table', TimetableController::class);
});
