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
            $table->date('session_date');
            $table->string('qr_token')->unique();
            $table->datetime('expires_at');
            $table->timestamps();
            $table->foreign('class_id')->references('id')->on('classes');
            $table->unique(['class_id', 'session_date']);
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
