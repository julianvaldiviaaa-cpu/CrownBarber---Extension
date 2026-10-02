<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    public function configure(): static
    {
        return $this->afterCreating(function (Service $service): void {
            $branchId = Branch::query()->orderBy('id')->value('id');

            if ($branchId !== null) {
                $service->branches()->syncWithoutDetaching([$branchId]);
            }
        });
    }

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => $name,
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 80, 400),
            'duration' => fake()->randomElement([20, 30, 45, 60]),
            'active' => true,
            'slug' => Str::slug($name),
        ];
    }
}
