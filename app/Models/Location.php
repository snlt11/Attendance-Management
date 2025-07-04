<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\ClassModel;

class Location extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'address',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    /**
     * Get the classes that use this location.
     */
    public function classes()
    {
        return $this->hasMany(ClassModel::class, 'location_id');
    }
}
