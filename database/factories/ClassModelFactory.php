<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ClassModelFactory extends Factory
{
    public function definition()
    {
        return [
            'subject_id' => \App\Models\Subject::factory(),
            'user_id' => \App\Models\User::factory(),
            'location_id' => \App\Models\Location::factory(),
            'start_time' => fake()->time(),
            'end_time' => fake()->time(),
        ];
    }
}
