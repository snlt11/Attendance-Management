<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasUuids, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'date_of_birth',
        'address',
        'role',
        'status',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the classes that this user teaches (for teachers)
     */
    public function teachingClasses()
    {
        return $this->hasMany(\App\Models\ClassModel::class, 'user_id');
    }

    /**
     * Get the classes that this user is enrolled in (for students)
     */
    public function enrolledClasses()
    {
        return $this->belongsToMany(\App\Models\ClassModel::class, 'class_students', 'user_id', 'class_id')
            ->withTimestamps();
    }

    /**
     * Get the attendance records for this user
     */
    public function attendanceRecords()
    {
        return $this->hasMany(\App\Models\Attendance::class, 'user_id');
    }
}
