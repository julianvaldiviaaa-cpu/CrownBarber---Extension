<?php

use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use App\UserRoles;

it('rechaza reservas malformadas sin errores de servidor', function (array $invalid, string $field) {
    $client = User::factory()->create(['role' => UserRoles::User]);
    $worker = User::factory()->create(['role' => UserRoles::Worker]);
    $service = Service::factory()->create();

    $this->actingAs($client)->postJson(route('appointments.store'), array_replace([
        'worker_id' => $worker->id,
        'services' => [$service->id],
        'date' => now()->addDay()->format('Y-m-d'),
        'time' => '12:00',
    ], $invalid))->assertUnprocessable()->assertJsonValidationErrors($field);

    expect(Appointment::count())->toBe(0);
})->with([
    [['services' => 'invalid'], 'services'],
    [['services' => [['invalid']]], 'services.0'],
    [['date' => 'invalid-date'], 'date'],
    [['time' => 'invalid-time'], 'time'],
    [['date' => null], 'date'],
]);

it('rechaza reservas y disponibilidad de barberos eliminados', function () {
    $client = User::factory()->create(['role' => UserRoles::User]);
    $worker = User::factory()->create(['role' => UserRoles::Worker]);
    $service = Service::factory()->create();
    $worker->delete();
    $data = ['worker_id' => $worker->id, 'services' => [$service->id], 'date' => now()->addDay()->format('Y-m-d'), 'time' => '12:00'];

    $this->actingAs($client)->postJson(route('appointments.store'), $data)->assertUnprocessable()->assertJsonValidationErrors('worker_id');
    $this->getJson(route('appointments.availability', $data))->assertUnprocessable()->assertJsonValidationErrors('worker_id');
    expect(Appointment::count())->toBe(0);
});

it('no consulta disponibilidad para cuentas de clientes', function () {
    $client = User::factory()->create(['role' => UserRoles::User]);
    $service = Service::factory()->create();

    $this->actingAs($client)->getJson(route('appointments.availability', [
        'worker_id' => $client->id, 'services' => [$service->id], 'date' => now()->addDay()->format('Y-m-d'),
    ]))->assertUnprocessable()->assertJsonValidationErrors('worker_id');
});

it('rechaza propuestas de fecha inválidas sin modificar la cita', function () {
    $worker = User::factory()->create(['role' => UserRoles::Worker]);
    $appointment = Appointment::factory()->pending()->create(['worker_id' => $worker->id]);

    $this->actingAs($worker)->postJson(route('appointments.propose', $appointment), ['starts_at' => 'invalid'])
        ->assertUnprocessable()->assertJsonValidationErrors('starts_at');

    expect($appointment->fresh()->proposed_starts_at)->toBeNull();
});
