<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $facial = DB::table('services')->where('slug', 'facial')->first();

        if ($facial) {
            DB::table('services')->where('id', $facial->id)->update([
                'name' => 'Facial',
                'price' => 650,
                'duration' => 75,
                'active' => true,
                'loyalty_reward_type' => 'facial',
                'deleted_at' => null,
                'updated_at' => now(),
            ]);

            return;
        }

        DB::table('services')->insert([
            'name' => 'Facial',
            'slug' => 'facial',
            'description' => 'Cuidado facial de 75 minutos.',
            'price' => 650,
            'duration' => 75,
            'active' => true,
            'loyalty_reward_type' => 'facial',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // El servicio es un dato comercial; conservarlo evita borrar reservas e historial.
    }
};
