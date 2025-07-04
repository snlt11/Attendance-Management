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
        User::create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'role' => 'teacher',
            'status' => 'active',
            'password' => bcrypt('SuperSecure@123'),
            'phone' => '0123456789',
            'date_of_birth' => '1980-01-01',
            'address' => '123 Admin Street, Admin City, Admin Country',
        ]);

        // Create users from users.json and fill missing fields with Faker
        $usersDataPath = database_path('seeders/data/users.json');
        if (file_exists($usersDataPath)) {
            $users = json_decode(file_get_contents($usersDataPath), true);
            if (is_array($users) && count($users) > 0) {
                $faker = \Faker\Factory::create('en_US');
                $phoneCounter = 6;
                $studentDob = strtotime('2000-01-06');
                $teacherDob = strtotime('1980-01-03');
                $users = array_map(function ($user) use ($faker) {
                    $user['password'] = bcrypt($user['password']);
                    $user['phone'] = $faker->phoneNumber;
                    $user['date_of_birth'] = $faker->date('Y-m-d', '-18 years');
                    $user['address'] = $faker->address;
                    $user['created_at'] = now();
                    $user['updated_at'] = now();
                    return $user;
                }, $users);
                User::insert($users);
            }
        }

        // Create subjects from subjects.json
        $subjectsDataPath = database_path('seeders/data/subjects.json');
        if (file_exists($subjectsDataPath)) {
            $subjects = json_decode(file_get_contents($subjectsDataPath), true);
            if (is_array($subjects) && count($subjects) > 0) {
                Subject::insert($subjects);
            }
        }

        // Create locations from locations.json (real Myanmar locations)
        $locationsDataPath = database_path('seeders/data/locations.json');
        if (file_exists($locationsDataPath)) {
            $locations = json_decode(file_get_contents($locationsDataPath), true);
            if (is_array($locations) && count($locations) > 0) {
                $now = now();
                $locationsToInsert = [];
                foreach ($locations as $loc) {
                    $locationsToInsert[] = [
                        'id' => $loc['id'],
                        'name' => $loc['name'],
                        'address' => $loc['address'],
                        'latitude' => $loc['latitude'],
                        'longitude' => $loc['longitude'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
                Location::insert($locationsToInsert);
            }
        }

        sleep(1);

        // Create classes and assign at least 10 students to each
        $subjects = Subject::all();
        $teachers = User::where('role', 'teacher')->get();
        $students = User::where('role', 'student')->get();
        $locations = Location::all();
        $faker = \Faker\Factory::create('en_US');
        $classCount = min($subjects->count(), $teachers->count(), $locations->count());
        $studentChunks = $students->chunk(10);
        $i = 0;
        foreach ($subjects as $subject) {
            if ($i >= $classCount) break;
            $teacher = $teachers[$i % $teachers->count()];
            $location = $locations[$i % $locations->count()];
            $class = ClassModel::create([
                'subject_id' => $subject->id,
                'location_id' => $location->id,
                'user_id' => $teacher->id,
                'name' => $subject->name . ' Class',
                'description' => $faker->sentence,
                'status' => 'active',
                'registration_code' => strtoupper($faker->bothify('CL####')),
                // All classes in 2025
                'start_date' => $faker->dateTimeBetween('2025-01-01', '2025-01-15')->format('Y-m-d'),
                'end_date' => $faker->dateTimeBetween('2025-03-01', '2025-12-31')->format('Y-m-d'),
                'max_students' => 30,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            // Attach at least 10 students
            $studentSet = $studentChunks[$i % $studentChunks->count()];
            $class->students()->attach($studentSet->pluck('id')->toArray());

            // Add class schedules: Mon-Fri (1 per day), Sat/Sun (5 per day)
            $daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            foreach ($daysOfWeek as $day) {
                $count = in_array($day, ['saturday', 'sunday']) ? 5 : 1;
                for ($j = 0; $j < $count; $j++) {
                    $startHour = 8 + $j * 2; // 8:00, 10:00, 12:00, 14:00, 16:00
                    $endHour = $startHour + 1;
                    $class->schedules()->create([
                        'day_of_week' => $day,
                        'start_time' => sprintf('%02d:00', $startHour),
                        'end_time' => sprintf('%02d:00', $endHour),
                    ]);
                }
            }
            $i++;
        }
    }
}
