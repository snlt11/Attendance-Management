<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->string('code')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Add foreign key constraint to classes table now that subjects exists
        Schema::table('classes', function (Blueprint $table) {
            $table->foreign('subject_id')->references('id')->on('subjects');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign key constraint from classes table first
        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign(['subject_id']);
        });

        Schema::dropIfExists('subjects');
    }
};
