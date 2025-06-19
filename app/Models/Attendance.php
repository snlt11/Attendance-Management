<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Attendance extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'class_session_id',
        'student_id',
        'checked_in_at',
        'status'
    ];

    protected $casts = [
        'checked_in_at' => 'datetime'
    ];

    public function classSession()
    {
        return $this->belongsTo(ClassSession::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
