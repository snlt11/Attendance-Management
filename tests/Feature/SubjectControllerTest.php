<?php

namespace Tests\Feature;

use App\Models\Subject;
use App\Models\User;
use App\Models\ClassModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class SubjectControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'role' => 'teacher',
            'status' => 'active'
        ]);
    }

    /** @test */
    public function it_can_list_all_subjects()
    {
        Subject::factory()->count(5)->create();

        $response = $this->actingAs($this->user)
            ->get('/subjects');

        $response->assertStatus(200)
            ->assertInertia(
                fn($page) =>
                $page->component('subjects')
                    ->has('subjects', 5)
                    ->has(
                        'subjects.0',
                        fn($subject) =>
                        $subject->has('id')
                            ->has('name')
                            ->has('code')
                            ->has('description')
                    )
            );
    }

    /** @test */
    public function it_orders_subjects_by_name()
    {
        Subject::factory()->create(['name' => 'Zebra Subject']);
        Subject::factory()->create(['name' => 'Alpha Subject']);
        Subject::factory()->create(['name' => 'Beta Subject']);

        $response = $this->actingAs($this->user)
            ->get('/subjects');

        $response->assertStatus(200);

        $subjects = $response->viewData('page')['props']['subjects'];

        $this->assertEquals('Alpha Subject', $subjects[0]['name']);
        $this->assertEquals('Beta Subject', $subjects[1]['name']);
        $this->assertEquals('Zebra Subject', $subjects[2]['name']);
    }

    /** @test */
    public function it_can_create_a_new_subject()
    {
        $subjectData = [
            'name' => 'Mathematics',
            'code' => 'MATH101',
            'description' => 'Basic mathematics course',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/subjects', $subjectData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Subject created successfully!',
                'subject' => [
                    'name' => 'Mathematics',
                    'code' => 'MATH101',
                    'description' => 'Basic mathematics course',
                ]
            ]);

        $this->assertDatabaseHas('subjects', [
            'name' => 'Mathematics',
            'code' => 'MATH101',
            'description' => 'Basic mathematics course',
        ]);
    }

    /** @test */
    public function it_validates_required_name_when_creating_subject()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/subjects', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function it_validates_unique_name_when_creating_subject()
    {
        Subject::factory()->create(['name' => 'Mathematics']);

        $subjectData = [
            'name' => 'Mathematics', // Duplicate name
            'code' => 'MATH101',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/subjects', $subjectData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name'])
            ->assertJsonFragment([
                'name' => ['A subject with this name already exists.']
            ]);
    }

    /** @test */
    public function it_validates_name_length()
    {
        $subjectData = [
            'name' => str_repeat('a', 101), // Exceeds max length of 100
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/subjects', $subjectData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name'])
            ->assertJsonFragment([
                'name' => ['Subject name cannot exceed 100 characters.']
            ]);
    }

    /** @test */
    public function it_validates_code_length()
    {
        $subjectData = [
            'name' => 'Mathematics',
            'code' => str_repeat('a', 51), // Exceeds max length of 50
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/subjects', $subjectData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    /** @test */
    public function it_validates_description_length()
    {
        $subjectData = [
            'name' => 'Mathematics',
            'description' => str_repeat('a', 256), // Exceeds max length of 255
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/subjects', $subjectData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['description']);
    }

    /** @test */
    public function it_allows_optional_fields_to_be_null()
    {
        $subjectData = [
            'name' => 'Mathematics',
            // code and description are optional
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/subjects', $subjectData);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('subjects', [
            'name' => 'Mathematics',
            'code' => null,
            'description' => null,
        ]);
    }

    /** @test */
    public function it_can_update_an_existing_subject()
    {
        $subject = Subject::factory()->create([
            'name' => 'Original Name',
            'code' => 'ORIG101',
            'description' => 'Original description',
        ]);

        $updateData = [
            'name' => 'Updated Name',
            'code' => 'UPD101',
            'description' => 'Updated description',
        ];

        $response = $this->actingAs($this->user)
            ->putJson("/subjects/{$subject->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Subject updated successfully!',
                'subject' => [
                    'id' => $subject->id,
                    'name' => 'Updated Name',
                    'code' => 'UPD101',
                    'description' => 'Updated description',
                ]
            ]);

        $this->assertDatabaseHas('subjects', [
            'id' => $subject->id,
            'name' => 'Updated Name',
            'code' => 'UPD101',
            'description' => 'Updated description',
        ]);
    }

    /** @test */
    public function it_validates_unique_name_when_updating_subject_excluding_self()
    {
        $subject1 = Subject::factory()->create(['name' => 'Mathematics']);
        $subject2 = Subject::factory()->create(['name' => 'Physics']);

        $updateData = [
            'name' => 'Physics', // Try to use another subject's name
        ];

        $response = $this->actingAs($this->user)
            ->putJson("/subjects/{$subject1->id}", $updateData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name'])
            ->assertJsonFragment([
                'name' => ['A subject with this name already exists.']
            ]);
    }

    /** @test */
    public function it_allows_keeping_same_name_when_updating_subject()
    {
        $subject = Subject::factory()->create(['name' => 'Mathematics']);

        $updateData = [
            'name' => 'Mathematics', // Same name
            'code' => 'MATH101',
        ];

        $response = $this->actingAs($this->user)
            ->putJson("/subjects/{$subject->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function it_can_delete_subject_without_related_classes()
    {
        $subject = Subject::factory()->create();

        $response = $this->actingAs($this->user)
            ->deleteJson("/subjects/{$subject->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Subject deleted successfully!'
            ]);

        $this->assertDatabaseMissing('subjects', ['id' => $subject->id]);
    }

    /** @test */
    public function it_cannot_delete_subject_with_related_classes()
    {
        $subject = Subject::factory()->create(['name' => 'Mathematics']);

        // Create a class that uses this subject
        ClassModel::factory()->create(['subject_id' => $subject->id]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/subjects/{$subject->id}");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'suggestion' => 'reassign_or_remove_classes'
            ])
            ->assertJsonStructure(['message']);

        // Subject should still exist
        $this->assertDatabaseHas('subjects', ['id' => $subject->id]);
    }

    /** @test */
    public function it_shows_correct_error_message_for_single_class_dependency()
    {
        $subject = Subject::factory()->create(['name' => 'Mathematics']);

        // Create exactly one class
        ClassModel::factory()->create(['subject_id' => $subject->id]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/subjects/{$subject->id}");

        $response->assertStatus(422);

        $message = $response->json('message');
        $this->assertStringContainsString('Mathematics', $message);
        $this->assertStringContainsString('1', $message);
        $this->assertStringContainsString('class', $message);
        $this->assertStringNotContainsString('classes', $message);
    }

    /** @test */
    public function it_shows_correct_error_message_for_multiple_class_dependencies()
    {
        $subject = Subject::factory()->create(['name' => 'Mathematics']);

        // Create multiple classes
        ClassModel::factory()->count(3)->create(['subject_id' => $subject->id]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/subjects/{$subject->id}");

        $response->assertStatus(422);

        $message = $response->json('message');
        $this->assertStringContainsString('Mathematics', $message);
        $this->assertStringContainsString('3', $message);
        $this->assertStringContainsString('classes', $message);
    }

    /** @test */
    public function it_handles_database_errors_during_deletion()
    {
        $subject = Subject::factory()->create();

        // Try to delete a non-existent subject
        $response = $this->actingAs($this->user)
            ->deleteJson("/subjects/99999");

        $response->assertStatus(404);
    }

    /** @test */
    public function unauthorized_user_cannot_access_subject_endpoints()
    {
        $subject = Subject::factory()->create();

        $this->getJson('/subjects')->assertStatus(401);
        $this->postJson('/subjects', [])->assertStatus(401);
        $this->putJson("/subjects/{$subject->id}", [])->assertStatus(401);
        $this->deleteJson("/subjects/{$subject->id}")->assertStatus(401);
    }

    /** @test */
    public function it_trims_whitespace_from_inputs()
    {
        $subjectData = [
            'name' => '  Mathematics  ',
            'code' => '  MATH101  ',
            'description' => '  Basic mathematics course  ',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/subjects', $subjectData);

        $response->assertStatus(200);

        // Check that whitespace was trimmed (depending on your validation rules)
        $this->assertDatabaseHas('subjects', [
            'name' => 'Mathematics',
            'code' => 'MATH101',
            'description' => 'Basic mathematics course',
        ]);
    }

    /** @test */
    public function it_handles_special_characters_in_name()
    {
        $subjectData = [
            'name' => 'Mathematics & Statistics',
            'code' => 'MATH&STAT',
            'description' => 'Combined math & stats course',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/subjects', $subjectData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('subjects', [
            'name' => 'Mathematics & Statistics',
            'code' => 'MATH&STAT',
            'description' => 'Combined math & stats course',
        ]);
    }

    /** @test */
    public function it_handles_unicode_characters()
    {
        $subjectData = [
            'name' => 'သင်္ချာ', // Myanmar language
            'code' => 'မသ၁၀၁',
            'description' => 'အခြေခံသင်္ချာသင်ခန်းစာ',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/subjects', $subjectData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('subjects', [
            'name' => 'သင်္ချာ',
            'code' => 'မသ၁၀၁',
            'description' => 'အခြေခံသင်္ချာသင်ခန်းစာ',
        ]);
    }

    /** @test */
    public function it_handles_empty_optional_fields()
    {
        $subjectData = [
            'name' => 'Mathematics',
            'code' => '',
            'description' => '',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/subjects', $subjectData);

        $response->assertStatus(200);

        // Empty strings should be stored as null for optional fields
        $this->assertDatabaseHas('subjects', [
            'name' => 'Mathematics',
            'code' => null,
            'description' => null,
        ]);
    }
}
