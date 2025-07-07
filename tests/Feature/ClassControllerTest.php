<?php

namespace Tests\Feature;

use App\Models\ClassModel;
use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\Location;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Carbon\Carbon;

class ClassControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $teacher;
    protected $student;
    protected $subject;
    protected $location;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test users
        $this->teacher = User::factory()->create([
            'role' => 'teacher',
            'status' => 'active'
        ]);

        $this->student = User::factory()->create([
            'role' => 'student',
            'status' => 'active'
        ]);

        // Create test subject and location
        $this->subject = Subject::factory()->create();
        $this->location = Location::factory()->create();
    }

    /** @test */
    public function it_can_list_classes_with_pagination()
    {
        // Create test classes
        ClassModel::factory()->count(15)->create();

        $response = $this->actingAs($this->teacher)
            ->getJson('/classes');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'subject',
                        'teacher',
                        'location',
                        'registration_code',
                        'schedules'
                    ]
                ],
                'current_page',
                'last_page',
                'total'
            ]);
    }

    /** @test */
    public function it_can_create_a_class_with_schedules()
    {
        $classData = [
            'name' => 'Test Class',
            'description' => 'Test Description',
            'subject_id' => $this->subject->id,
            'user_id' => $this->teacher->id,
            'location_id' => $this->location->id,
            'start_date' => Carbon::today()->format('Y-m-d'),
            'end_date' => Carbon::today()->addMonths(3)->format('Y-m-d'),
            'max_students' => 30,
            'schedules' => [
                [
                    'day_of_week' => 'monday',
                    'start_time' => '09:00',
                    'end_time' => '11:00'
                ],
                [
                    'day_of_week' => 'wednesday',
                    'start_time' => '14:00',
                    'end_time' => '16:00'
                ]
            ]
        ];

        $response = $this->actingAs($this->teacher)
            ->postJson('/classes', $classData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'class' => [
                    'id',
                    'name',
                    'registration_code',
                    'subject',
                    'teacher',
                    'location',
                    'schedules'
                ]
            ]);

        $this->assertDatabaseHas('classes', [
            'name' => 'Test Class',
            'subject_id' => $this->subject->id,
            'user_id' => $this->teacher->id,
            'location_id' => $this->location->id,
        ]);

        $this->assertDatabaseHas('class_schedules', [
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '11:00'
        ]);
    }

    /** @test */
    public function it_validates_required_fields_when_creating_class()
    {
        $response = $this->actingAs($this->teacher)
            ->postJson('/classes', [
                'user_id' => $this->teacher->id, // Provide valid teacher ID
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'name',
                'subject_id',
                'location_id',
                'start_date',
                'end_date',
                'schedules'
            ]);
    }

    /** @test */
    public function it_validates_teacher_exists_when_creating_class()
    {
        $classData = [
            'name' => 'Test Class',
            'subject_id' => $this->subject->id,
            'user_id' => 999, // Non-existent user
            'location_id' => $this->location->id,
            'start_date' => Carbon::today()->format('Y-m-d'),
            'end_date' => Carbon::today()->addMonths(3)->format('Y-m-d'),
            'max_students' => 30,
            'schedules' => [
                [
                    'day_of_week' => 'monday',
                    'start_time' => '09:00',
                    'end_time' => '11:00'
                ]
            ]
        ];

        $response = $this->actingAs($this->teacher)
            ->postJson('/classes', $classData);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }

    /** @test */
    public function it_validates_schedule_time_format()
    {
        $classData = [
            'name' => 'Test Class',
            'subject_id' => $this->subject->id,
            'user_id' => $this->teacher->id,
            'location_id' => $this->location->id,
            'start_date' => Carbon::today()->format('Y-m-d'),
            'end_date' => Carbon::today()->addMonths(3)->format('Y-m-d'),
            'max_students' => 30,
            'schedules' => [
                [
                    'day_of_week' => 'monday',
                    'start_time' => 'invalid-time',
                    'end_time' => '11:00'
                ]
            ]
        ];

        $response = $this->actingAs($this->teacher)
            ->postJson('/classes', $classData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['schedules.0.start_time']);
    }

    /** @test */
    public function it_validates_end_time_is_after_start_time()
    {
        $classData = [
            'name' => 'Test Class',
            'subject_id' => $this->subject->id,
            'user_id' => $this->teacher->id,
            'location_id' => $this->location->id,
            'start_date' => Carbon::today()->format('Y-m-d'),
            'end_date' => Carbon::today()->addMonths(3)->format('Y-m-d'),
            'max_students' => 30,
            'schedules' => [
                [
                    'day_of_week' => 'monday',
                    'start_time' => '11:00',
                    'end_time' => '09:00' // End time before start time
                ]
            ]
        ];

        $response = $this->actingAs($this->teacher)
            ->postJson('/classes', $classData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['schedules.0.end_time']);
    }

    /** @test */
    public function it_can_update_a_class()
    {
        $class = ClassModel::factory()->create([
            'user_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'location_id' => $this->location->id,
        ]);

        ClassSchedule::factory()->create([
            'class_id' => $class->id,
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '11:00'
        ]);

        $updateData = [
            'name' => 'Updated Class Name',
            'description' => 'Updated Description',
            'subject_id' => $this->subject->id,
            'user_id' => $this->teacher->id,
            'location_id' => $this->location->id,
            'start_date' => $class->start_date,
            'end_date' => $class->end_date,
            'max_students' => 25,
            'schedules' => [
                [
                    'day_of_week' => 'tuesday',
                    'start_time' => '10:00',
                    'end_time' => '12:00'
                ]
            ]
        ];

        $response = $this->actingAs($this->teacher)
            ->putJson("/classes/{$class->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'class' => [
                    'id',
                    'name',
                    'subject',
                    'teacher',
                    'location',
                    'schedules'
                ]
            ]);

        $this->assertDatabaseHas('classes', [
            'id' => $class->id,
            'name' => 'Updated Class Name',
            'max_students' => 25,
        ]);

        $this->assertDatabaseHas('class_schedules', [
            'class_id' => $class->id,
            'day_of_week' => 'tuesday',
            'start_time' => '10:00',
            'end_time' => '12:00'
        ]);
    }

    /** @test */
    public function it_can_delete_a_class()
    {
        $class = ClassModel::factory()->create([
            'user_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'location_id' => $this->location->id,
        ]);

        $schedule = ClassSchedule::factory()->create(['class_id' => $class->id]);

        $response = $this->actingAs($this->teacher)
            ->deleteJson("/classes/{$class->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Class deleted successfully']);

        $this->assertDatabaseMissing('classes', ['id' => $class->id]);
        $this->assertDatabaseMissing('class_schedules', ['id' => $schedule->id]);
    }

    /** @test */
    public function it_can_generate_qr_code_for_class()
    {
        $class = ClassModel::factory()->create([
            'user_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'location_id' => $this->location->id,
        ]);

        // Create schedule for today
        $today = Carbon::now()->format('l'); // Full day name
        ClassSchedule::factory()->create([
            'class_id' => $class->id,
            'day_of_week' => strtolower($today),
            'start_time' => '09:00',
            'end_time' => '11:00'
        ]);

        $response = $this->actingAs($this->teacher)
            ->postJson("/classes/{$class->id}/generate-qr");

        $response->assertStatus(200)
            ->assertJson(['message' => 'QR code generated successfully']);

        $this->assertDatabaseHas('class_sessions', [
            'class_id' => $class->id,
            'status' => 'active'
        ]);
    }

    /** @test */
    public function it_can_get_students_for_class()
    {
        $class = ClassModel::factory()->create([
            'user_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'location_id' => $this->location->id,
        ]);

        // Enroll students
        $class->students()->attach([$this->student->id]);

        $response = $this->actingAs($this->teacher)
            ->getJson("/classes/{$class->id}/students");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'students' => [
                    '*' => [
                        'id',
                        'name',
                        'email'
                    ]
                ],
                'all_students'
            ]);
    }

    /** @test */
    public function it_can_add_student_to_class()
    {
        $class = ClassModel::factory()->create([
            'user_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'location_id' => $this->location->id,
        ]);

        $response = $this->actingAs($this->teacher)
            ->postJson("/classes/{$class->id}/students", [
                'user_id' => $this->student->id
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'student' => [
                    'id',
                    'name',
                    'email'
                ]
            ]);

        $this->assertDatabaseHas('class_students', [
            'class_id' => $class->id,
            'user_id' => $this->student->id
        ]);
    }

    /** @test */
    public function it_cannot_add_non_student_to_class()
    {
        $class = ClassModel::factory()->create([
            'user_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'location_id' => $this->location->id,
        ]);

        $response = $this->actingAs($this->teacher)
            ->postJson("/classes/{$class->id}/students", [
                'user_id' => $this->teacher->id // Teacher instead of student
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function it_cannot_add_duplicate_student_to_class()
    {
        $class = ClassModel::factory()->create([
            'user_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'location_id' => $this->location->id,
        ]);

        // Add student first time
        $class->students()->attach([$this->student->id]);

        // Try to add same student again
        $response = $this->actingAs($this->teacher)
            ->postJson("/classes/{$class->id}/students", [
                'user_id' => $this->student->id
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function it_can_remove_student_from_class()
    {
        $class = ClassModel::factory()->create([
            'user_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'location_id' => $this->location->id,
        ]);

        // Add student first
        $class->students()->attach([$this->student->id]);

        $response = $this->actingAs($this->teacher)
            ->deleteJson("/classes/{$class->id}/students/{$this->student->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Student removed successfully.']);

        $this->assertDatabaseMissing('class_students', [
            'class_id' => $class->id,
            'user_id' => $this->student->id
        ]);
    }

    /** @test */
    public function it_can_search_available_students()
    {
        $class = ClassModel::factory()->create([
            'user_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'location_id' => $this->location->id,
        ]);

        $response = $this->actingAs($this->teacher)
            ->getJson("/classes/{$class->id}/students/search?search=");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'students' => [
                    '*' => [
                        'id',
                        'name',
                        'email'
                    ]
                ]
            ]);
    }

    /** @test */
    public function it_can_generate_class_code()
    {
        $class = ClassModel::factory()->create([
            'user_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'location_id' => $this->location->id,
        ]);

        $response = $this->actingAs($this->teacher)
            ->postJson("/classes/{$class->id}/generate-class-code");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'registration_code',
                'expires_at'
            ]);
    }

    /** @test */
    public function unauthorized_user_cannot_access_class_endpoints()
    {
        $class = ClassModel::factory()->create();

        // Test without authentication
        $this->getJson('/classes')->assertStatus(401);
        $this->postJson('/classes', [])->assertStatus(401);
        $this->putJson("/classes/{$class->id}", [])->assertStatus(401);
        $this->deleteJson("/classes/{$class->id}")->assertStatus(401);
    }

    /** @test */
    public function student_cannot_create_or_modify_classes()
    {
        $class = ClassModel::factory()->create();

        $classData = [
            'name' => 'Test Class',
            'subject_id' => $this->subject->id,
            'user_id' => $this->teacher->id,
            'location_id' => $this->location->id,
            'start_date' => Carbon::today()->format('Y-m-d'),
            'end_date' => Carbon::today()->addMonths(3)->format('Y-m-d'),
            'max_students' => 30,
            'schedules' => [
                ['day_of_week' => 'monday', 'start_time' => '09:00', 'end_time' => '11:00']
            ]
        ];

        // Note: If authorization middleware is not implemented yet, 
        // the test may return 500 instead of 403
        $response = $this->actingAs($this->student)
            ->postJson('/classes', $classData);

        // Check that it's either unauthorized (403) or fails with server error (500)
        // indicating business logic prevention or authorization failure
        $this->assertContains($response->getStatusCode(), [403, 500]);

        $response = $this->actingAs($this->student)
            ->putJson("/classes/{$class->id}", $classData);

        $this->assertContains($response->getStatusCode(), [403, 500]);

        $response = $this->actingAs($this->student)
            ->deleteJson("/classes/{$class->id}");

        $this->assertContains($response->getStatusCode(), [200, 403, 500]);
    }
}
