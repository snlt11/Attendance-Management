<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class SubjectFactory extends Factory
{
    public function definition()
    {
        return [
            'name' => fake()->word(),
            'code' => fake()->unique()->bothify('SUB###'),
            'description' => fake()->sentence(),
            'created_at' => now(),
            'updated_at' => now(),
        ]; 
    }
}