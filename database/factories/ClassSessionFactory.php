<?php

namespace Database\Factories;

use App\Models\ClassModel;
use App\Models\ClassSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClassSessionFactory extends Factory
{
    protected $model = \App\Models\ClassSession::class;

    public function definition()
    {
        return [
            'class_id' => ClassModel::factory(),
            'class_schedule_id' => ClassSchedule::factory(),
            'session_date' => fake()->dateTimeBetween('now', '+1 week')->format('Y-m-d'),
            'start_time' => fake()->time('H:i:s'),
            'end_time' => fake()->time('H:i:s'),
            'status' => fake()->randomElement(['active', 'inactive', 'completed']),
            'qr_token' => fake()->sha256(),
            'expires_at' => fake()->dateTimeBetween('now', '+1 hour'),
        ];
    }
}
