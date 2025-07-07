<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'teacher',
            'status' => 'active'
        ]);
    }

    /** @test */
    public function it_can_list_all_users()
    {
        User::factory()->count(5)->create();

        $response = $this->actingAs($this->admin)
            ->get('/users');

        $response->assertStatus(200)
            ->assertInertia(
                fn($page) =>
                $page->component('users')
                    ->has('users')
                    ->has('auth.user')
            );
    }

    /** @test */
    public function it_can_create_a_new_user()
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'phone' => $this->faker->phoneNumber,
            'role' => 'student',
            'status' => 'active',
            'address' => $this->faker->address,
            'date_of_birth' => $this->faker->date(),
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/users', $userData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User created successfully'
            ])
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                    'role',
                    'status'
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'name' => $userData['name'],
            'email' => $userData['email'],
            'role' => $userData['role'],
            'status' => $userData['status'],
        ]);
    }

    /** @test */
    public function it_validates_required_fields_when_creating_user()
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/users', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'name',
                'email',
                'role',
                'status'
            ]);
    }

    /** @test */
    public function it_validates_unique_email_when_creating_user()
    {
        $existingUser = User::factory()->create();

        $userData = [
            'name' => $this->faker->name,
            'email' => $existingUser->email, // Duplicate email
            'role' => 'student',
            'status' => 'active',
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/users', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_validates_role_enum_when_creating_user()
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'role' => 'invalid_role', // Invalid role
            'status' => 'active',
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/users', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    /** @test */
    public function it_validates_status_enum_when_creating_user()
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'role' => 'student',
            'status' => 'invalid_status', // Invalid status
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/users', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function it_can_update_an_existing_user()
    {
        $user = User::factory()->create([
            'role' => 'student',
            'status' => 'active'
        ]);

        $updateData = [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'phone' => '123-456-7890',
            'role' => 'teacher',
            'status' => 'inactive',
            'address' => 'Updated Address',
            'date_of_birth' => '1990-01-01',
        ];

        $response = $this->actingAs($this->admin)
            ->putJson("/users/{$user->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User updated successfully'
            ])
            ->assertJsonPath('user.name', 'Updated Name')
            ->assertJsonPath('user.email', 'updated@example.com')
            ->assertJsonPath('user.role', 'teacher')
            ->assertJsonPath('user.status', 'inactive');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'role' => 'teacher',
            'status' => 'inactive',
        ]);
    }

    /** @test */
    public function it_validates_unique_email_when_updating_user_excluding_self()
    {
        $user1 = User::factory()->create(['email' => 'user1@example.com']);
        $user2 = User::factory()->create(['email' => 'user2@example.com']);

        $updateData = [
            'name' => $user1->name,
            'email' => $user2->email, // Try to use another user's email
            'role' => $user1->role,
            'status' => $user1->status,
        ];

        $response = $this->actingAs($this->admin)
            ->putJson("/users/{$user1->id}", $updateData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_allows_keeping_same_email_when_updating_user()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $updateData = [
            'name' => 'Updated Name',
            'email' => 'test@example.com', // Same email
            'role' => $user->role,
            'status' => $user->status,
        ];

        $response = $this->actingAs($this->admin)
            ->putJson("/users/{$user->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function it_can_delete_user_without_related_data()
    {
        $user = User::factory()->create([
            'role' => 'student',
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    /** @test */
    public function it_cannot_delete_teacher_with_classes()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        // Create a class for this teacher
        DB::table('classes')->insert([
            'name' => 'Test Class',
            'user_id' => $teacher->id,
            'subject_id' => 1, // Assuming subject exists
            'location_id' => 1, // Assuming location exists
            'registration_code' => 'TEST123',
            'status' => 'active',
            'start_date' => now()->format('Y-m-d'),
            'end_date' => now()->addMonths(3)->format('Y-m-d'),
            'max_students' => 30,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/users/{$teacher->id}");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'suggestion' => 'suspend'
            ])
            ->assertJsonStructure(['message']);

        $this->assertDatabaseHas('users', ['id' => $teacher->id]);
    }

    /** @test */
    public function it_cannot_delete_student_with_class_enrollments()
    {
        $student = User::factory()->create(['role' => 'student']);

        // Create a class enrollment for this student
        DB::table('class_students')->insert([
            'class_id' => 1, // Assuming class exists
            'user_id' => $student->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/users/{$student->id}");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'suggestion' => 'suspend'
            ])
            ->assertJsonStructure(['message']);

        $this->assertDatabaseHas('users', ['id' => $student->id]);
    }

    /** @test */
    public function it_cannot_delete_user_with_attendance_records()
    {
        $student = User::factory()->create(['role' => 'student']);

        // Create attendance record for this student
        DB::table('attendances')->insert([
            'user_id' => $student->id,
            'class_session_id' => 1, // Assuming session exists
            'status' => 'present',
            'checked_in_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/users/{$student->id}");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'suggestion' => 'suspend'
            ])
            ->assertJsonStructure(['message']);

        $this->assertDatabaseHas('users', ['id' => $student->id]);
    }

    /** @test */
    public function unauthorized_user_cannot_access_user_endpoints()
    {
        $user = User::factory()->create();

        $this->getJson('/users')->assertStatus(401);
        $this->postJson('/users', [])->assertStatus(401);
        $this->putJson("/users/{user->id}", [])->assertStatus(401);
        $this->deleteJson("/users/{user->id}")->assertStatus(401);
    }

    /** @test */
    public function it_validates_email_format()
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => 'invalid-email-format',
            'role' => 'student',
            'status' => 'active',
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/users', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_validates_date_of_birth_format()
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'role' => 'student',
            'status' => 'active',
            'date_of_birth' => 'invalid-date-format',
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/users', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date_of_birth']);
    }

    /** @test */
    public function it_handles_optional_fields_correctly()
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'role' => 'student',
            'status' => 'active',
            // Optional fields not provided
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/users', $userData);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('users', [
            'name' => $userData['name'],
            'email' => $userData['email'],
            'phone' => null,
            'address' => null,
            'date_of_birth' => null,
        ]);
    }

    /** @test */
    public function it_handles_database_errors_gracefully()
    {
        $user = User::factory()->create();

        // Mock a database error by trying to delete a non-existent user
        $response = $this->actingAs($this->admin)
            ->deleteJson("/users/99999");

        $response->assertStatus(404);
    }
}
