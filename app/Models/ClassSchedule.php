<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ClassSchedule extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'class_schedules';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'class_id',
        'day_of_week',
        'start_time',
        'end_time',
    ];

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function sessions()
    {
        return $this->hasMany(ClassSession::class, 'class_schedule_id');
    }
}
