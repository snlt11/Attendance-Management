<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ClassSession extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'class_id',
        'session_date',
        'qr_token',
        'expires_at'
    ];

    protected $casts = [
        'session_date' => 'date',
        'expires_at' => 'datetime'
    ];

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}
