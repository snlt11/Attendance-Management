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
        'subject_id',
        'user_id',
        'location_id',
        'registration_code',
        'registration_code_expires_at',
        'max_students',
        'start_time',
        'end_time',
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
        return $this->belongsToMany(User::class, 'class_students', 'class_id', 'student_id')->where('role', 'student');
    }

    public function sessions()
    {
        return $this->hasMany(ClassSession::class, 'class_id');
    }
}
