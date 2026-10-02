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
        Schema::table('services', function (Blueprint $table) {
            $table->string('loyalty_reward_type')->nullable();
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->timestamp('completed_at')->nullable();
            $table->date('loyalty_visit_date')->nullable();
            $table->foreignId('loyalty_reward_service_id')->nullable()->constrained('services')->restrictOnDelete();
            $table->string('loyalty_reward_name')->nullable();
            $table->decimal('loyalty_discount', 10, 2)->default(0);
            $table->unique(['user_id', 'loyalty_visit_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'loyalty_visit_date']);
            $table->dropConstrainedForeignId('loyalty_reward_service_id');
            $table->dropColumn(['completed_at', 'loyalty_visit_date', 'loyalty_reward_name', 'loyalty_discount']);
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('loyalty_reward_type');
        });
    }
};
