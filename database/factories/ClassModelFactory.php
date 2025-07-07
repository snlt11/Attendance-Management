<?php

namespace Database\Factories;

use App\Helpers\Helper;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClassModelFactory extends Factory
{
    public function definition()
    {
        return [
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['active', 'inactive']),
            'subject_id' => \App\Models\Subject::factory(),
            'user_id' => \App\Models\User::factory(),
            'location_id' => \App\Models\Location::factory(),
            'registration_code' => Helper::generate(),
            'registration_code_expires_at' => now()->addDays(7),
            'max_students' => fake()->numberBetween(1, 30),
            'start_date' => fake()->dateTimeBetween('now', '+1 month')->format('Y-m-d'),
            'end_date' => fake()->dateTimeBetween('+1 month', '+3 months')->format('Y-m-d'),
        ];
    }
}
