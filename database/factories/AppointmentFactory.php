<?php

namespace Database\Factories;

use App\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use App\UserRoles;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('+1 day', '+1 month');

        return [
            'user_id' => User::factory()->state(['role' => UserRoles::User->value]),
            'worker_id' => User::factory()->state(['role' => UserRoles::Worker->value]),
            'starts_at' => $startsAt,
            'status' => AppointmentStatus::Pending,
            'total_price' => 0,
            'total_duration' => 30,
            'proposed_starts_at' => null,
            'proposed_by' => null,
            'cancelled_by' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => AppointmentStatus::Pending]);
    }

    public function proposed(): static
    {
        return $this->state(fn () => ['status' => AppointmentStatus::Proposed]);
    }

    public function confirmed(): static
    {
        return $this->state(fn () => ['status' => AppointmentStatus::Confirmed]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => AppointmentStatus::Cancelled]);
    }

    /**
     * Adjunta servicios con el snapshot de precio/nombre al momento de la cita.
     */
    public function withServices(int $count = 1): static
    {
        return $this->afterCreating(function (Appointment $appointment) use ($count) {
            $services = Service::factory()->count($count)->create();

            $totalPrice = 0;
            $totalDuration = 0;

            foreach ($services as $service) {
                $appointment->services()->attach($service->id, [
                    'price' => $service->price,
                    'name' => $service->name,
                ]);

                $totalPrice += (float) $service->price;
                $totalDuration += $service->duration;
            }

            $appointment->forceFill([
                'total_price' => $totalPrice,
                'total_duration' => $totalDuration,
            ])->save();
        });
    }
}
