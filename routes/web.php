<?php

use App\Http\Controllers\ClassController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // User management routes
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('users/list', [UserController::class, 'list'])->name('users.list');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Classes routes
    Route::get('classes', [ClassController::class, 'index'])->name('classes.index');
    Route::post('classes', [ClassController::class, 'store'])->name('classes.store');
    Route::put('classes/{class}', [ClassController::class, 'update'])->name('classes.update');
    Route::delete('classes/{class}', [ClassController::class, 'destroy'])->name('classes.destroy');
    Route::post('classes/{class}/generate-qr', [ClassController::class, 'generateQR'])->name('classes.generate-qr');

    // Attendance routes
    Route::resource('subjects', SubjectController::class);

    Route::resource('locations', LocationController::class);
    Route::get('departments', fn() => inertia('departments'));
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
