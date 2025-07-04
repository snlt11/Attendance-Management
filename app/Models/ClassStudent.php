<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ClassStudent extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = ['class_id', 'user_id'];

    public $incrementing = false;

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }
}
