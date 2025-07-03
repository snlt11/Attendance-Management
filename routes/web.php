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
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Classes routes
    Route::get('classes', [ClassController::class, 'index'])->name('classes.index');
    Route::post('classes', [ClassController::class, 'store'])->name('classes.store');
    Route::put('classes/{class}', [ClassController::class, 'update'])->name('classes.update');
    Route::delete('classes/{class}', [ClassController::class, 'destroy'])->name('classes.destroy');
    Route::post('classes/{class}/generate-qr', [ClassController::class, 'generateQR'])->name('classes.generate-qr');

    // Class students routes
    Route::get('classes/{class}/students', [ClassController::class, 'getStudents'])->name('classes.students');
    Route::post('classes/{class}/students', [ClassController::class, 'addStudent'])->name('classes.students.add');
    Route::delete('classes/{class}/students/{user}', [ClassController::class, 'removeStudent'])->name('classes.students.remove');

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
