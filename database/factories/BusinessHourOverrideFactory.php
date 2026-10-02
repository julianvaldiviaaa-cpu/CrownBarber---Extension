<?php

namespace Database\Factories;

use App\Models\BusinessHourOverride;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BusinessHourOverride>
 */
class BusinessHourOverrideFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'date' => fake()->dateTimeBetween('+1 day', '+1 month')->format('Y-m-d'),
            'open_time' => '10:00',
            'close_time' => '16:00',
            'is_closed' => false,
        ];
    }

    public function closed(): static
    {
        return $this->state(fn () => [
            'open_time' => null,
            'close_time' => null,
            'is_closed' => true,
        ]);
    }
}
