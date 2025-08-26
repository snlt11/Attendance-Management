<?php

use App\Models\SchoolSettingModel;
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
        Schema::create('school_setting', function (Blueprint $table) {
            $table->id();
            $table->string('key')->default('ABCXYZ')->unique();
            $table->boolean('is_used')->default(false);
            $table->timestamps();
        });

        SchoolSettingModel::updateOrCreate([
            'key' => 'ABCXYZ',
        ], [
            'is_used' => false,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_setting');
    }
};
