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
            $table->uuid('class_schedule_id')->nullable()->after('class_id')->index();
            $table->time('start_time')->after('session_date');
            $table->time('end_time')->after('start_time');
            $table->enum('status', ['scheduled', 'active', 'completed', 'cancelled'])->default('scheduled')->after('end_time');
            $table->date('session_date');
            $table->string('qr_token')->nullable()->after('session_date');
            $table->datetime('expires_at')->nullable()->after('qr_token');
            $table->timestamps();
            $table->foreign('class_id')->references('id')->on('classes');
            $table->foreign('class_schedule_id')->references('id')->on('class_schedules')->onDelete('set null');
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
