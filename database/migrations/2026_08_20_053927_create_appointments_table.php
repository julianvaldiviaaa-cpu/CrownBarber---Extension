<?php

use App\AppointmentStatus;
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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('worker_id')->constrained('users')->cascadeOnDelete();

            $table->dateTime('starts_at');
            $table->enum('status', AppointmentStatus::values())->default(AppointmentStatus::Pending->value);

            $table->decimal('total_price', 10, 2);
            $table->unsignedInteger('total_duration');

            // Negociación de hora: quién propuso la última hora alternativa.
            $table->dateTime('proposed_starts_at')->nullable();
            $table->foreignId('proposed_by')->nullable()->constrained('users')->nullOnDelete();

            // Auditoría de cancelación.
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();

            $table->index(['worker_id', 'starts_at']);
            $table->index(['user_id', 'starts_at']);

            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
