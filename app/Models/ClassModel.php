<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ClassModel extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'id',
        'subject_id',
        'location_id',
        'user_id', // Teacher
        'name',
        'code',
        'description',
        'registration_code',
        'status',
        'start_date',
        'end_date',
        'max_students',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'user_id')->where('role', 'teacher');
    }

    public function students()
    {
        return $this->belongsToMany(User::class, 'class_students', 'class_id', 'user_id')->where('role', 'student');
    }

    public function sessions()
    {
        return $this->hasMany(ClassSession::class, 'class_id');
    }

    public function schedules()
    {
        return $this->hasMany(ClassSchedule::class, 'class_id');
    }
}
