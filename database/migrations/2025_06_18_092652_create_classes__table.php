<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable()->after('name');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('description');
            $table->uuid('subject_id')->index();
            $table->uuid('user_id')->index();
            $table->uuid('location_id')->index();
            $table->string('registration_code')->nullable();
            $table->timestamp('registration_code_expires_at')->default(now()->addDays(60))->after('registration_code');
            $table->integer('max_students')->default(30)->after('registration_code_expires_at');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();

            $table->foreign('subject_id')->references('id')->on('subjects');
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('location_id')->references('id')->on('locations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
