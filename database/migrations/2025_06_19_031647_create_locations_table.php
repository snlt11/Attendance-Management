<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('address');
            $table->timestamps();
            $table->index('name');
        });

        // Add foreign key constraint to classes table now that locations exists
        Schema::table('classes', function (Blueprint $table) {
            $table->foreign('location_id')->references('id')->on('locations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign key constraint from classes table first
        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign(['location_id']);
        });

        Schema::dropIfExists('locations');
    }
};
