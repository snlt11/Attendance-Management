<?php

use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // User management routes
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Classes routes
    Route::get('classes', [ClassController::class, 'index'])->name('classes.index');
    Route::post('classes', [ClassController::class, 'store'])->name('classes.store');
    Route::put('classes/{class}', [ClassController::class, 'update'])->name('classes.update');
    Route::delete('classes/{class}', [ClassController::class, 'destroy'])->name('classes.destroy');
    Route::post('classes/{class}/generate-qr', [ClassController::class, 'generateQR'])->name('classes.generate-qr');
    Route::post('classes/{class}/generate-class-code', [ClassController::class, 'generateClassCode'])->name('classes.generate-class-code.store');

    // Add these class student management routes
    Route::prefix('classes/{class}')->group(function () {
        Route::get('students', [ClassController::class, 'getStudents'])->name('classes.students.index');
        Route::get('students/search', [ClassController::class, 'searchAvailableStudents'])->name('classes.students.search');
        Route::post('students', [ClassController::class, 'addStudent'])->name('classes.students.store');
        Route::delete('students/{user}', [ClassController::class, 'removeStudent'])->name('classes.students.destroy');
    });

    // Subject routes
    Route::get('subjects', [SubjectController::class, 'index'])->name('subjects.index');
    // Route::get('subjects/list', [SubjectController::class, 'list'])->name('subjects.list');
    Route::post('subjects', [SubjectController::class, 'store'])->name('subjects.store');
    Route::put('subjects/{subject}', [SubjectController::class, 'update'])->name('subjects.update');
    Route::delete('subjects/{subject}', [SubjectController::class, 'destroy'])->name('subjects.destroy');

    Route::resource('locations', LocationController::class);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
