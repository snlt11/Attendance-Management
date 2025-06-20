<?php

namespace Database\Factories;

use App\Helpers\Helper;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClassModelFactory extends Factory
{
    public function definition()
    {
        return [
            'subject_id' => \App\Models\Subject::factory(),
            'user_id' => \App\Models\User::factory(),
            'location_id' => \App\Models\Location::factory(),
            'registration_code' => Helper::generate(),
            'registration_code_expires_at' => now()->addDays(7),
            'max_students' => fake()->numberBetween(1, 30),
            'start_time' => fake()->time(),
            'end_time' => fake()->time(),
        ];
    }
}
