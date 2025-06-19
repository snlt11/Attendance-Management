<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\ClassModel;
use App\Models\Location;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create users
        User::factory(100)->create();

        // Create subjects
        Subject::factory(50)->create();

        // Create locations
        Location::factory(40)->create();

        // Create classes
        ClassModel::factory(100)->create();
    }
}
