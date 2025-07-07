<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\User;
use App\Models\ClassModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class LocationControllerTest extends TestCase
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
    public function it_can_list_all_locations()
    {
        Location::factory()->count(5)->create();

        $response = $this->actingAs($this->user)
            ->get('/locations');

        $response->assertStatus(200)
            ->assertInertia(
                fn($page) =>
                $page->component('locations')
                    ->has('locations', 5)
                    ->has(
                        'locations.0',
                        fn($location) =>
                        $location->has('id')
                            ->has('name')
                            ->has('latitude')
                            ->has('longitude')
                            ->has('address')
                            ->has('created_at')
                    )
            );
    }

    /** @test */
    public function it_can_create_a_new_location()
    {
        $locationData = [
            'name' => 'Test Location',
            'latitude' => 16.8661,
            'longitude' => 96.1951,
            'address' => 'Test Address, Yangon',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/locations', $locationData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'location' => [
                    'name' => 'Test Location',
                    'latitude' => 16.8661,
                    'longitude' => 96.1951,
                    'address' => 'Test Address, Yangon',
                ]
            ]);

        $this->assertDatabaseHas('locations', [
            'name' => 'Test Location',
            'latitude' => 16.8661,
            'longitude' => 96.1951,
            'address' => 'Test Address, Yangon',
        ]);
    }

    /** @test */
    public function it_validates_required_fields_when_creating_location()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/locations', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'name',
                'latitude',
                'longitude'
            ]);
    }

    /** @test */
    public function it_validates_latitude_range()
    {
        $locationData = [
            'name' => 'Test Location',
            'latitude' => 100, // Invalid latitude (should be between -90 and 90)
            'longitude' => 96.1951,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/locations', $locationData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['latitude']);
    }

    /** @test */
    public function it_validates_longitude_range()
    {
        $locationData = [
            'name' => 'Test Location',
            'latitude' => 16.8661,
            'longitude' => 200, // Invalid longitude (should be between -180 and 180)
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/locations', $locationData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['longitude']);
    }

    /** @test */
    public function it_validates_negative_latitude_and_longitude()
    {
        $locationData = [
            'name' => 'Test Location',
            'latitude' => -45.0,
            'longitude' => -120.0,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/locations', $locationData);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('locations', [
            'latitude' => -45.0,
            'longitude' => -120.0,
        ]);
    }

    /** @test */
    public function it_validates_address_length()
    {
        $locationData = [
            'name' => 'Test Location',
            'latitude' => 16.8661,
            'longitude' => 96.1951,
            'address' => str_repeat('a', 501), // Exceeds max length of 500
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/locations', $locationData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['address']);
    }

    /** @test */
    public function it_allows_null_address()
    {
        $locationData = [
            'name' => 'Test Location',
            'latitude' => 16.8661,
            'longitude' => 96.1951,
            // address is optional
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/locations', $locationData);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('locations', [
            'name' => 'Test Location',
            'address' => null,
        ]);
    }

    /** @test */
    public function it_can_update_an_existing_location()
    {
        $location = Location::factory()->create([
            'name' => 'Original Location',
            'latitude' => 16.8661,
            'longitude' => 96.1951,
            'address' => 'Original Address',
        ]);

        $updateData = [
            'name' => 'Updated Location',
            'latitude' => 17.0000,
            'longitude' => 97.0000,
            'address' => 'Updated Address',
        ];

        $response = $this->actingAs($this->user)
            ->putJson("/locations/{$location->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'location' => [
                    'id' => $location->id,
                    'name' => 'Updated Location',
                    'latitude' => 17.0,
                    'longitude' => 97.0,
                    'address' => 'Updated Address',
                ]
            ]);

        $this->assertDatabaseHas('locations', [
            'id' => $location->id,
            'name' => 'Updated Location',
            'latitude' => 17.0,
            'longitude' => 97.0,
            'address' => 'Updated Address',
        ]);
    }

    /** @test */
    public function it_can_delete_location_without_related_classes()
    {
        $location = Location::factory()->create();

        $response = $this->actingAs($this->user)
            ->deleteJson("/locations/{$location->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Location deleted successfully.'
            ]);

        $this->assertDatabaseMissing('locations', ['id' => $location->id]);
    }

    /** @test */
    public function it_cannot_delete_location_with_related_classes()
    {
        $location = Location::factory()->create();

        // Create a class that uses this location
        ClassModel::factory()->create(['location_id' => $location->id]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/locations/{$location->id}");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonStructure(['message']);

        // Location should still exist
        $this->assertDatabaseHas('locations', ['id' => $location->id]);
    }

    /** @test */
    public function it_shows_correct_error_message_for_single_class_dependency()
    {
        $location = Location::factory()->create(['name' => 'Test Location']);

        // Create exactly one class
        ClassModel::factory()->create(['location_id' => $location->id]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/locations/{$location->id}");

        $response->assertStatus(422)
            ->assertJsonFragment([
                'success' => false,
            ]);

        // Check that the message mentions "1 class" (singular)
        $this->assertStringContainsString('1', $response->json('message'));
        $this->assertStringContainsString('class', $response->json('message'));
    }

    /** @test */
    public function it_shows_correct_error_message_for_multiple_class_dependencies()
    {
        $location = Location::factory()->create(['name' => 'Test Location']);

        // Create multiple classes
        ClassModel::factory()->count(3)->create(['location_id' => $location->id]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/locations/{$location->id}");

        $response->assertStatus(422)
            ->assertJsonFragment([
                'success' => false,
            ]);

        // Check that the message mentions "3 classes" (plural)
        $this->assertStringContainsString('3', $response->json('message'));
        $this->assertStringContainsString('classes', $response->json('message'));
    }

    /** @test */
    public function it_returns_location_data_in_correct_format()
    {
        $location = Location::factory()->create([
            'name' => 'Test Location',
            'latitude' => 16.8661,
            'longitude' => 96.1951,
            'address' => 'Test Address',
        ]);

        $response = $this->actingAs($this->user)
            ->get('/locations');

        $response->assertStatus(200);

        $locationData = $response->viewData('page')['props']['locations'][0];

        $this->assertEquals('Test Location', $locationData['name']);
        $this->assertEquals(16.8661, $locationData['latitude']);
        $this->assertEquals(96.1951, $locationData['longitude']);
        $this->assertEquals('Test Address', $locationData['address']);
        $this->assertIsString($locationData['created_at']);
    }

    /** @test */
    public function it_handles_decimal_precision_for_coordinates()
    {
        $locationData = [
            'name' => 'Precise Location',
            'latitude' => 16.866123456,
            'longitude' => 96.195123456,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/locations', $locationData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('locations', [
            'name' => 'Precise Location',
            'latitude' => 16.866123456,
            'longitude' => 96.195123456,
        ]);
    }

    /** @test */
    public function unauthorized_user_cannot_access_location_endpoints()
    {
        $location = Location::factory()->create();

        $this->getJson('/locations')->assertStatus(401);
        $this->postJson('/locations', [])->assertStatus(401);
        $this->putJson("/locations/{$location->id}", [])->assertStatus(401);
        $this->deleteJson("/locations/{$location->id}")->assertStatus(401);
    }

    /** @test */
    public function it_validates_name_length()
    {
        $locationData = [
            'name' => str_repeat('a', 256), // Exceeds max length of 255
            'latitude' => 16.8661,
            'longitude' => 96.1951,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/locations', $locationData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function it_validates_latitude_as_numeric()
    {
        $locationData = [
            'name' => 'Test Location',
            'latitude' => 'not-a-number',
            'longitude' => 96.1951,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/locations', $locationData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['latitude']);
    }

    /** @test */
    public function it_validates_longitude_as_numeric()
    {
        $locationData = [
            'name' => 'Test Location',
            'latitude' => 16.8661,
            'longitude' => 'not-a-number',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/locations', $locationData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['longitude']);
    }

    /** @test */
    public function it_handles_non_existent_location_update()
    {
        $updateData = [
            'name' => 'Updated Location',
            'latitude' => 17.0000,
            'longitude' => 97.0000,
        ];

        $response = $this->actingAs($this->user)
            ->putJson("/locations/99999", $updateData);

        $response->assertStatus(404);
    }

    /** @test */
    public function it_handles_non_existent_location_deletion()
    {
        $response = $this->actingAs($this->user)
            ->deleteJson("/locations/99999");

        $response->assertStatus(404);
    }
}
