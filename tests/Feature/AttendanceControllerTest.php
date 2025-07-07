<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\ClassModel;
use App\Models\ClassSession;
use App\Models\Location;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class AttendanceControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $student;
    protected $teacher;
    protected $subject;
    protected $location;
    protected $class;
    protected $session;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test users
        $this->student = User::factory()->create([
            'role' => 'student',
            'status' => 'active'
        ]);

        $this->teacher = User::factory()->create([
            'role' => 'teacher',
            'status' => 'active'
        ]);

        // Create test data
        $this->subject = Subject::factory()->create();
        $this->location = Location::factory()->create([
            'latitude' => 16.8409,
            'longitude' => 96.1735,
        ]);

        $this->class = ClassModel::factory()->create([
            'subject_id' => $this->subject->id,
            'user_id' => $this->teacher->id,
            'location_id' => $this->location->id,
            'start_date' => Carbon::today()->format('Y-m-d'),
            'end_date' => Carbon::today()->addDays(30)->format('Y-m-d'),
        ]);

        // Enroll student in class
        DB::table('class_students')->insert([
            'class_id' => $this->class->id,
            'user_id' => $this->student->id,
        ]);

        // Create active session
        $this->session = ClassSession::factory()->create([
            'class_id' => $this->class->id,
            'session_date' => Carbon::today()->format('Y-m-d'),
            'start_time' => Carbon::now()->subMinutes(30)->format('H:i:s'),
            'end_time' => Carbon::now()->addMinutes(30)->format('H:i:s'),
            'status' => 'active',
            'qr_token' => Str::random(32),
            'expires_at' => Carbon::now()->addMinutes(5),
        ]);
    }

    /** @test */
    public function authenticated_student_can_check_in_with_valid_qr_code()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $this->session->qr_token,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'attendance' => [
                    'id',
                    'user_id',
                    'class_session_id',
                    'status',
                    'checked_in_at',
                ],
                'session' => [
                    'class_name',
                    'subject',
                    'teacher',
                    'location',
                    'session_date',
                    'start_time',
                    'end_time',
                ]
            ]);

        $this->assertDatabaseHas('attendances', [
            'user_id' => $this->student->id,
            'class_session_id' => $this->session->id,
            'status' => 'present',
        ]);
    }

    /** @test */
    public function unauthenticated_user_cannot_check_in()
    {
        $response = $this->postJson('/api/attendance', [
            'qr_token' => $this->session->qr_token,
            'latitude' => $this->location->latitude,
            'longitude' => $this->location->longitude,
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function teacher_cannot_check_in()
    {
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $this->session->qr_token,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Only students can scan QR codes for attendance.'
            ]);
    }

    /** @test */
    public function it_rejects_invalid_qr_token()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => 'invalid-token',
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Invalid QR code. Please ask your teacher to generate a new one.'
            ]);
    }

    /** @test */
    public function it_rejects_expired_qr_token()
    {
        // Set session to expired
        $this->session->update([
            'expires_at' => Carbon::now()->subMinutes(1)
        ]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $this->session->qr_token,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'This QR code has expired. Please ask your teacher to generate a new one.'
            ]);
    }

    /** @test */
    public function it_rejects_student_not_enrolled_in_class()
    {
        $otherStudent = User::factory()->create([
            'role' => 'student',
            'status' => 'active'
        ]);

        $response = $this->actingAs($otherStudent, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $this->session->qr_token,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'You are not enrolled in this class.'
            ]);
    }

    /** @test */
    public function it_prevents_duplicate_check_in()
    {
        // First check-in
        Attendance::create([
            'user_id' => $this->student->id,
            'class_session_id' => $this->session->id,
            'status' => 'present',
            'checked_in_at' => Carbon::now(),
        ]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $this->session->qr_token,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'message' => 'You have already checked in for this class session.'
            ]);
    }

    /** @test */
    public function it_validates_location_proximity()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $this->session->qr_token,
                'latitude' => 40.7128, // New York coordinates (far from class location)
                'longitude' => -74.0060,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'You are not close enough to the class location to check in.'
            ]);
    }

    /** @test */
    public function it_requires_location_coordinates()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $this->session->qr_token,
                // Missing latitude and longitude
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Your location is required to check in.'
            ]);
    }

    /** @test */
    public function it_validates_class_timing()
    {
        // Create session outside current time
        $futureSession = ClassSession::factory()->create([
            'class_id' => $this->class->id,
            'session_date' => Carbon::today()->format('Y-m-d'),
            'start_time' => Carbon::now()->addHours(2)->format('H:i:s'),
            'end_time' => Carbon::now()->addHours(3)->format('H:i:s'),
            'status' => 'active',
            'qr_token' => Str::random(32),
            'expires_at' => Carbon::now()->addMinutes(5),
        ]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $futureSession->qr_token,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(422);

        // Check that the message contains the expected text about class schedule time
        $responseData = $response->json();
        $this->assertStringContainsString(
            'You can only check in during the class schedule time:',
            $responseData['message']
        );
    }

    /** @test */
    public function it_validates_class_date_range()
    {
        // Create a class that hasn't started yet
        $futureClass = ClassModel::factory()->create([
            'subject_id' => $this->subject->id,
            'user_id' => $this->teacher->id,
            'location_id' => $this->location->id,
            'start_date' => Carbon::tomorrow()->format('Y-m-d'),
            'end_date' => Carbon::tomorrow()->addDays(30)->format('Y-m-d'),
        ]);

        // Enroll student in future class
        DB::table('class_students')->insert([
            'class_id' => $futureClass->id,
            'user_id' => $this->student->id,
        ]);

        $futureSession = ClassSession::factory()->create([
            'class_id' => $futureClass->id,
            'session_date' => Carbon::today()->format('Y-m-d'),
            'start_time' => Carbon::now()->subMinutes(30)->format('H:i:s'),
            'end_time' => Carbon::now()->addMinutes(30)->format('H:i:s'),
            'status' => 'active',
            'qr_token' => Str::random(32),
            'expires_at' => Carbon::now()->addMinutes(5),
        ]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $futureSession->qr_token,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(422);

        // Check that the message contains the expected text about class start date
        $responseData = $response->json();
        $this->assertStringContainsString(
            'You cannot check in before the class start date:',
            $responseData['message']
        );
    }

    /** @test */
    public function it_handles_missing_class_location()
    {
        // Instead of testing null coordinates, test with coordinates set to 0,0 
        // which is a common way to indicate missing location data
        $emptyLocation = Location::factory()->create([
            'latitude' => 0,
            'longitude' => 0,
        ]);

        $classWithoutLocation = ClassModel::factory()->create([
            'subject_id' => $this->subject->id,
            'user_id' => $this->teacher->id,
            'location_id' => $emptyLocation->id,
            'start_date' => Carbon::today()->format('Y-m-d'),
            'end_date' => Carbon::today()->addDays(30)->format('Y-m-d'),
        ]);

        // Enroll student
        DB::table('class_students')->insert([
            'class_id' => $classWithoutLocation->id,
            'user_id' => $this->student->id,
        ]);

        $sessionWithoutLocation = ClassSession::factory()->create([
            'class_id' => $classWithoutLocation->id,
            'session_date' => Carbon::today()->format('Y-m-d'),
            'start_time' => Carbon::now()->subMinutes(30)->format('H:i:s'),
            'end_time' => Carbon::now()->addMinutes(30)->format('H:i:s'),
            'status' => 'active',
            'qr_token' => Str::random(32),
            'expires_at' => Carbon::now()->addMinutes(5),
        ]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $sessionWithoutLocation->qr_token,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'This class does not have a location set. Please contact your teacher.'
            ]);
    }

    /** @test */
    public function it_validates_qr_token_format()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => 'short', // Too short
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'QR token is required and must be valid.'
            ]);
    }

    /** @test */
    public function it_handles_inactive_session()
    {
        $this->session->update(['status' => 'inactive']);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $this->session->qr_token,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Invalid QR code. Please ask your teacher to generate a new one.'
            ]);
    }

    /** @test */
    public function it_calculates_distance_correctly()
    {
        // Test with coordinates within 100 meters of class location
        $nearbyLatitude = $this->location->latitude + 0.0001; // Very small offset
        $nearbyLongitude = $this->location->longitude + 0.0001;

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $this->session->qr_token,
                'latitude' => $nearbyLatitude,
                'longitude' => $nearbyLongitude,
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('attendances', [
            'user_id' => $this->student->id,
            'class_session_id' => $this->session->id,
            'status' => 'present',
        ]);
    }

    /** @test */
    public function it_handles_server_errors_gracefully()
    {
        // Mock a scenario that would cause a server error
        $this->session->delete(); // Delete session but keep the QR token reference

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $this->session->qr_token,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Invalid QR code. Please ask your teacher to generate a new one.'
            ]);
    }

    /** @test */
    public function it_returns_detailed_session_info_on_successful_checkin()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/attendance', [
                'qr_token' => $this->session->qr_token,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'attendance',
                'session' => [
                    'class_name',
                    'subject',
                    'teacher',
                    'location',
                    'session_date',
                    'start_time',
                    'end_time',
                ]
            ])
            ->assertJsonFragment([
                'subject' => $this->subject->name,
                'teacher' => $this->teacher->name,
                'location' => $this->location->name,
            ]);
    }
}
