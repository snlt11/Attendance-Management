<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('class_session_id')->index();
            $table->uuid('user_id')->index();
            $table->datetime('checked_in_at')->nullable();
            $table->enum('status', ['present', 'late', 'absent']);
            $table->timestamps();
            $table->foreign('class_session_id')->references('id')->on('class_sessions');
            $table->foreign('user_id')->references('id')->on('users');
            $table->unique(['class_session_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
