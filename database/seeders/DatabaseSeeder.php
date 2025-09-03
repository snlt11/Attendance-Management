<?php

namespace Database\Seeders;

use App\Models\SchoolSettingModel;
use App\Models\User;
use App\Models\ClassModel;
use App\Models\Location;
use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user if it doesn't exist
        User::firstOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Admin',
                'role' => 'teacher',
                'status' => 'active',
                'password' => bcrypt('SuperSecure@123'),
                'phone' => '0123456789',
                'date_of_birth' => '1980-01-01',
                'address' => '123 Admin Street, Admin City, Admin Country',
            ]
        );

        SchoolSettingModel::updateOrCreate([
            'key' => 'ABCXYZ',
        ], [
            'is_used' => false,
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
                $now = now();
                $subjects = array_map(function ($subject) use ($now) {
                    $subject['created_at'] = $now;
                    $subject['updated_at'] = $now;
                    return $subject;
                }, $subjects);
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

        // Create current/ongoing classes and assign at least 10 students to each
        $subjects = Subject::all();
        $teachers = User::where('role', 'teacher')->get();
        $students = User::where('role', 'student')->get();
        $locations = Location::all();
        $faker = \Faker\Factory::create('en_US');
        $classCount = min($subjects->count(), $teachers->count(), $locations->count());
        $studentChunks = $students->chunk(10);

        // Create current/ongoing classes
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
                'description' => $subject->description ?: $faker->sentence,
                'status' => 'active',
                'registration_code' => strtoupper($faker->bothify('CL####')),
                // Classes spanning current period (auto-adjusts based on current date)
                'start_date' => $faker->dateTimeBetween('-2 months', '-1 month')->format('Y-m-d'),
                'end_date' => $faker->dateTimeBetween('+1 month', '+2 months')->format('Y-m-d'),
                'max_students' => rand(20, 35),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            // Attach at least 10 students
            $studentSet = $studentChunks[$i % $studentChunks->count()];
            $class->students()->attach($studentSet->pluck('id')->toArray());

            // Add realistic class schedules
            $schedulePatterns = [
                // Pattern 1: Mon-Wed-Fri classes
                ['monday', 'wednesday', 'friday'],
                // Pattern 2: Tue-Thu classes
                ['tuesday', 'thursday'],
                // Pattern 3: Weekend intensive
                ['saturday', 'sunday'],
                // Pattern 4: Daily classes (intensive course)
                ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                // Pattern 5: Mon-Thu classes
                ['monday', 'tuesday', 'wednesday', 'thursday']
            ];

            $pattern = $schedulePatterns[$i % count($schedulePatterns)];
            $timeSlots = [
                ['08:00', '09:30'],
                ['09:45', '11:15'],
                ['11:30', '13:00'],
                ['14:00', '15:30'],
                ['15:45', '17:15'],
                ['17:30', '19:00']
            ];

            $selectedTimeSlot = $timeSlots[array_rand($timeSlots)];

            foreach ($pattern as $day) {
                $class->schedules()->create([
                    'day_of_week' => $day,
                    'start_time' => $selectedTimeSlot[0],
                    'end_time' => $selectedTimeSlot[1],
                ]);
            }
            $i++;
        }

        // Create historical classes (completed classes for testing class history)
        if (ClassModel::where('status', 'completed')->count() === 0) {
            $this->createHistoricalClasses($subjects, $teachers, $students, $locations, $faker, $studentChunks);
        } else {
            echo "Historical classes already exist, skipping creation.\n";
        }

        // Create sample class sessions and attendance for dashboard testing
        $this->createSampleSessionsAndAttendance();
    }
    /**
     * Create comprehensive class sessions and attendance data for testing
     */
    private function createSampleSessionsAndAttendance()
    {
        $faker = \Faker\Factory::create('en_US');
        $today = \Carbon\Carbon::today();

        // Get all classes with students and schedules
        $classes = ClassModel::with(['students', 'schedules'])->get();

        foreach ($classes as $class) {
            $students = $class->students;
            $schedules = $class->schedules;

            if ($students->isEmpty() || $schedules->isEmpty()) {
                continue;
            }

            // Dynamically create sessions for current month, previous month, and next month
            $currentMonth = $today->month;
            $currentYear = $today->year;

            // Calculate previous month
            $prevMonth = $currentMonth - 1;
            $prevYear = $currentYear;
            if ($prevMonth < 1) {
                $prevMonth = 12;
                $prevYear--;
            }

            // Calculate next month
            $nextMonth = $currentMonth + 1;
            $nextYear = $currentYear;
            if ($nextMonth > 12) {
                $nextMonth = 1;
                $nextYear++;
            }

            // Create date range: start of previous month to end of next month
            $startDate = \Carbon\Carbon::create($prevYear, $prevMonth, 1);
            $endDate = \Carbon\Carbon::create($nextYear, $nextMonth)->endOfMonth();

            $monthNames = [
                1 => 'January',
                2 => 'February',
                3 => 'March',
                4 => 'April',
                5 => 'May',
                6 => 'June',
                7 => 'July',
                8 => 'August',
                9 => 'September',
                10 => 'October',
                11 => 'November',
                12 => 'December'
            ];

            $prevMonthName = $monthNames[$prevMonth];
            $currentMonthName = $monthNames[$currentMonth];
            $nextMonthName = $monthNames[$nextMonth];

            // Generate sessions based on class schedules
            for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
                $dayOfWeek = strtolower($date->format('l'));

                // Find schedules for this day
                $daySchedules = $schedules->where('day_of_week', $dayOfWeek);

                foreach ($daySchedules as $schedule) {
                    // Determine session status based on date relative to today
                    $status = match (true) {
                        $date->lt($today) => 'completed',
                        $date->eq($today) => $this->getTodaySessionStatus($schedule->start_time),
                        default => 'scheduled'
                    };

                    $session = \App\Models\ClassSession::create([
                        'class_id' => $class->id,
                        'class_schedule_id' => $schedule->id,
                        'session_date' => $date->format('Y-m-d'),
                        'start_time' => $schedule->start_time,
                        'end_time' => $schedule->end_time,
                        'status' => $status,
                        'qr_token' => Str::random(10),
                        'expires_at' => $date->copy()
                            ->setTimeFromTimeString($schedule->start_time)
                            ->addHours(2)
                    ]);

                    // Create attendance records for completed and active sessions
                    if (in_array($status, ['completed', 'active'])) {
                        $this->createAttendanceForSession($session, $students, $schedule, $date);
                    }
                }
            }
        }

        echo "Comprehensive class sessions and attendance data created for {$prevMonthName}-{$currentMonthName}-{$nextMonthName} {$currentYear}\n";
    }

    /**
     * Determine session status for today based on time
     */
    private function getTodaySessionStatus(string $startTime): string
    {
        $now = \Carbon\Carbon::now();
        $sessionStart = \Carbon\Carbon::today()->setTimeFromTimeString($startTime);
        $sessionEnd = $sessionStart->copy()->addHour();

        return match (true) {
            $now->lt($sessionStart) => 'scheduled',
            $now->between($sessionStart, $sessionEnd) => 'active',
            default => 'completed'
        };
    }

    /**
     * Create attendance records for a session
     */
    private function createAttendanceForSession($session, $students, $schedule, $date)
    {
        $faker = \Faker\Factory::create('en_US');
        $today = \Carbon\Carbon::today();

        // Calculate attendance rate based on day (higher on weekdays)
        $isWeekend = in_array(strtolower($date->format('l')), ['saturday', 'sunday']);
        $attendanceRate = $isWeekend ? 0.7 : 0.85; // 70% weekend, 85% weekday

        $maxAttendees = (int) ceil($students->count() * $attendanceRate);
        $actualAttendees = rand(max(1, $maxAttendees - 3), min($students->count(), $maxAttendees + 2));

        if ($students->count() === 0) {
            return; // No students to create attendance for
        }

        $actualAttendees = min($actualAttendees, $students->count());
        $selectedStudents = $students->random($actualAttendees);

        foreach ($selectedStudents as $student) {
            // Determine attendance status with realistic distribution
            $statusRandom = rand(1, 100);
            $status = match (true) {
                $statusRandom <= 80 => 'present',    // 80% present
                $statusRandom <= 95 => 'late',       // 15% late
                default => 'absent'                   // 5% absent (checked in but marked absent due to early leave)
            };

            // Calculate realistic check-in time
            $sessionStart = $date->copy()->setTimeFromTimeString($schedule->start_time);
            $checkedInAt = match ($status) {
                'present' => $sessionStart->copy()->addMinutes(rand(-5, 10)), // 5 min early to 10 min late
                'late' => $sessionStart->copy()->addMinutes(rand(11, 25)),    // 11-25 minutes late
                'absent' => $sessionStart->copy()->addMinutes(rand(-10, 30)), // Various times but marked absent
            };

            \App\Models\Attendance::create([
                'class_session_id' => $session->id,
                'user_id' => $student->id,
                'checked_in_at' => $checkedInAt,
                'status' => $status,
                'created_at' => $checkedInAt,
                'updated_at' => $checkedInAt
            ]);
        }

        // For some sessions, add students who didn't check in (absent)
        if ($session->status === 'completed' && rand(1, 100) <= 30) { // 30% chance
            $remainingStudents = $students->diff($selectedStudents);

            if ($remainingStudents->count() > 0) {
                $absentCount = rand(1, min(3, $remainingStudents->count()));
                $absentStudents = $remainingStudents->random($absentCount);

                foreach ($absentStudents as $student) {
                    \App\Models\Attendance::create([
                        'class_session_id' => $session->id,
                        'user_id' => $student->id,
                        'checked_in_at' => null, // No check-in time for absent students
                        'status' => 'absent',
                        'created_at' => $date->copy()->setTimeFromTimeString($schedule->start_time),
                        'updated_at' => $date->copy()->setTimeFromTimeString($schedule->start_time)
                    ]);
                }
            }
        }
    }

    /**
     * Create historical classes (completed classes for testing class history)
     */
    private function createHistoricalClasses($subjects, $teachers, $students, $locations, $faker, $studentChunks)
    {
        echo "Creating historical classes for testing class history...\n";

        // Create 6-8 historical classes from different time periods
        $historicalPeriods = [
            // Last year classes
            [
                'start_range' => '-12 months',
                'end_range' => '-10 months',
                'count' => 2,
                'prefix' => 'Advanced'
            ],
            [
                'start_range' => '-9 months',
                'end_range' => '-7 months',
                'count' => 2,
                'prefix' => 'Intermediate'
            ],
            // Earlier this year
            [
                'start_range' => '-6 months',
                'end_range' => '-4 months',
                'count' => 2,
                'prefix' => 'Foundation'
            ],
            // Recently completed
            [
                'start_range' => '-3 months',
                'end_range' => '-1 week',
                'count' => 2,
                'prefix' => 'Intensive'
            ]
        ];

        $historyClassIndex = 0;

        foreach ($historicalPeriods as $period) {
            for ($p = 0; $p < $period['count']; $p++) {
                if ($historyClassIndex >= $subjects->count()) break;

                $subject = $subjects[$historyClassIndex % $subjects->count()];
                $teacher = $teachers[$historyClassIndex % $teachers->count()];
                $location = $locations[$historyClassIndex % $locations->count()];

                $startDate = $faker->dateTimeBetween($period['start_range'], $period['end_range']);
                $endDate = (clone $startDate)->modify('+2 months'); // 2 month course duration

                $historicalClass = ClassModel::create([
                    'subject_id' => $subject->id,
                    'location_id' => $location->id,
                    'user_id' => $teacher->id,
                    'name' => $period['prefix'] . ' ' . $subject->name . ' Class',
                    'description' => $period['prefix'] . ' course in ' . $subject->name . '. ' . ($subject->description ?: $faker->sentence),
                    'status' => 'completed', // Mark as completed
                    'registration_code' => strtoupper($faker->bothify('HIS####')),
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'max_students' => rand(15, 30),
                    'created_at' => $startDate,
                    'updated_at' => $endDate,
                ]);

                // Attach students to historical classes
                $studentSet = $studentChunks[$historyClassIndex % $studentChunks->count()];
                $historicalClass->students()->attach($studentSet->pluck('id')->toArray());

                // Add schedules for historical classes
                $historicalSchedulePatterns = [
                    ['monday', 'wednesday', 'friday'],
                    ['tuesday', 'thursday'],
                    ['monday', 'tuesday', 'wednesday', 'thursday'],
                    ['saturday'],
                    ['monday', 'wednesday']
                ];

                $pattern = $historicalSchedulePatterns[$historyClassIndex % count($historicalSchedulePatterns)];
                $timeSlots = [
                    ['09:00', '10:30'],
                    ['11:00', '12:30'],
                    ['14:00', '15:30'],
                    ['16:00', '17:30'],
                    ['18:00', '19:30']
                ];

                $selectedTimeSlot = $timeSlots[array_rand($timeSlots)];

                foreach ($pattern as $day) {
                    $historicalClass->schedules()->create([
                        'day_of_week' => $day,
                        'start_time' => $selectedTimeSlot[0],
                        'end_time' => $selectedTimeSlot[1],
                    ]);
                }

                $historyClassIndex++;

                echo "Created historical class: {$historicalClass->name} ({$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')})\n";
            }
        }

        echo "Historical classes created successfully!\n";
    }
}
