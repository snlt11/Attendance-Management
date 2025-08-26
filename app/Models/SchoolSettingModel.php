<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolSettingModel extends Model
{
    protected $table = 'school_setting';

    protected $fillable = [
        'key',
        'is_used',
    ];

    protected $casts = [
        'is_used' => 'boolean',
    ];
}
