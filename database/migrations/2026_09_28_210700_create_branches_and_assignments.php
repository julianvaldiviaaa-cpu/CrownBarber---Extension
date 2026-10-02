<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('address')->nullable();
            $table->timestamps();
        });

        Schema::create('branch_service', function (Blueprint $table) {
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->primary(['branch_id', 'service_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
        });

        $branchId = DB::table('branches')->insertGetId([
            'name' => 'Sucursal principal',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('users')->whereIn('role', ['worker', 'admin'])->update(['branch_id' => $branchId]);
        DB::table('appointments')->update(['branch_id' => $branchId]);
        DB::table('services')->whereNull('deleted_at')->orderBy('id')->pluck('id')->each(
            fn (int $serviceId) => DB::table('branch_service')->insert(['branch_id' => $branchId, 'service_id' => $serviceId])
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', fn (Blueprint $table) => $table->dropConstrainedForeignId('branch_id'));
        Schema::table('users', fn (Blueprint $table) => $table->dropConstrainedForeignId('branch_id'));
        Schema::dropIfExists('branch_service');
        Schema::dropIfExists('branches');
    }
};
