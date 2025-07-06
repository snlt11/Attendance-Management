<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('class_id')->index();
            $table->enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();

            $table->foreign('class_id')->references('id')->on('classes')->onDelete('cascade');
        });

        // Add the foreign key constraint to class_sessions table now that class_schedules exists
        Schema::table('class_sessions', function (Blueprint $table) {
            $table->foreign('class_schedule_id')->references('id')->on('class_schedules')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('class_sessions', function (Blueprint $table) {
            $table->dropForeign(['class_schedule_id']);
        });

        Schema::dropIfExists('class_schedules');
    }
};
