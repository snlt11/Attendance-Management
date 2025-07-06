<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('class_id')->index();
            $table->uuid('class_schedule_id')->nullable()->index();
            $table->date('session_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('status', ['scheduled', 'active', 'completed', 'cancelled'])->default('scheduled');
            $table->string('qr_token')->nullable();
            $table->datetime('expires_at')->nullable();
            $table->timestamps();
            
            $table->foreign('class_id')->references('id')->on('classes');
            // Note: class_schedule_id foreign key will be added after class_schedules table is created
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_sessions');
    }
};
