<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('services')->whereIn('slug', ['corte-de-cabeio', 'corte-de-cabello', 'corte-clasico'])
            ->whereNull('loyalty_reward_type')->update(['loyalty_reward_type' => 'haircut']);
        DB::table('services')->whereIn('slug', ['facial', 'limpieza-facial'])
            ->whereNull('loyalty_reward_type')->update(['loyalty_reward_type' => 'facial']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Preserve administrator configuration; the schema rollback removes this column.
    }
};
