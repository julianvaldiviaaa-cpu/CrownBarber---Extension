<?php

use App\Models\BusinessHour;
use App\Models\BusinessHourOverride;
use App\Models\Service;
use App\Models\User;
use App\UserRoles;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;

it('solo los administradores gestionan los horarios', function () {
    $admin = User::factory()->create(['role' => UserRoles::Admin->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);

    $this->actingAs($worker)
        ->get(route('business-hours'))
        ->assertForbidden();

    $this->actingAs($worker)
        ->post(route('business-hours.store'), [
            'day_of_week' => 1,
            'open_time' => '09:00',
            'close_time' => '18:00',
        ])
        ->assertForbidden();

    $this->actingAs($admin)
        ->get(route('business-hours'))
        ->assertOk();

    expect(BusinessHour::count())->toBe(0);
});

it('el administrador crea y actualiza el horario semanal', function () {
    $admin = User::factory()->create(['role' => UserRoles::Admin->value]);

    $this->actingAs($admin)->post(route('business-hours.store'), [
        'day_of_week' => 1,
        'open_time' => '09:00',
        'close_time' => '18:00',
        'active' => true,
    ])->assertRedirect();

    $hour = BusinessHour::where('day_of_week', 1)->firstOrFail();

    expect($hour->open_time)->toBe('09:00');
    expect($hour->close_time)->toBe('18:00');

    $this->actingAs($admin)->put(route('business-hours.update', $hour), [
        'day_of_week' => 1,
        'open_time' => '10:00',
        'close_time' => '20:00',
        'active' => true,
    ])->assertRedirect();

    expect($hour->fresh()->close_time)->toBe('20:00');
});

it('crea una excepción de cierre por fecha y bloquea la disponibilidad', function () {
    $admin = User::factory()->create(['role' => UserRoles::Admin->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);
    $service = Service::factory()->create(['duration' => 30]);

    $date = Carbon::tomorrow()->format('Y-m-d');
    $dayOfWeek = (Carbon::tomorrow()->dayOfWeek + 6) % 7;

    BusinessHour::create([
        'day_of_week' => $dayOfWeek,
        'open_time' => '09:00',
        'close_time' => '18:00',
        'active' => true,
    ]);

    $this->actingAs($admin)->post(route('business-hours.overrides.store'), [
        'date' => $date,
        'is_closed' => true,
    ])->assertRedirect();

    expect(BusinessHourOverride::where('date', $date)->firstOrFail()->is_closed)->toBeTrue();

    $response = $this->actingAs($admin)
        ->get(route('appointments.availability', [
            'date' => $date,
            'worker_id' => $worker->id,
            'services' => [$service->id],
        ]))
        ->assertOk();

    expect($response->json('slots'))->toBe([]);
});

it('la excepción con horario especial tiene prioridad sobre el semanal', function () {
    $admin = User::factory()->create(['role' => UserRoles::Admin->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);
    $service = Service::factory()->create(['duration' => 30]);

    $date = Carbon::tomorrow()->format('Y-m-d');
    $dayOfWeek = (Carbon::tomorrow()->dayOfWeek + 6) % 7;

    BusinessHour::create([
        'day_of_week' => $dayOfWeek,
        'open_time' => '09:00',
        'close_time' => '18:00',
        'active' => true,
    ]);

    BusinessHourOverride::create([
        'date' => $date,
        'open_time' => '14:00',
        'close_time' => '15:00',
        'is_closed' => false,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('appointments.availability', [
            'date' => $date,
            'worker_id' => $worker->id,
            'services' => [$service->id],
        ]))
        ->assertOk();

    expect($response->json('slots'))->toBe(['14:00', '14:30']);
});

it('la disponibilidad sin barbero usa solo el horario del negocio', function () {
    $admin = User::factory()->create(['role' => UserRoles::Admin->value]);
    $service = Service::factory()->create(['duration' => 30]);

    $date = Carbon::tomorrow()->format('Y-m-d');
    $dayOfWeek = (Carbon::tomorrow()->dayOfWeek + 6) % 7;

    BusinessHour::create([
        'day_of_week' => $dayOfWeek,
        'open_time' => '14:00',
        'close_time' => '15:00',
        'active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('appointments.availability', [
            'date' => $date,
            'services' => [$service->id],
        ]))
        ->assertOk();

    expect($response->json('slots'))->toBe(['14:00', '14:30']);
});

it('elimina una excepción y restaura el horario semanal', function () {
    $admin = User::factory()->create(['role' => UserRoles::Admin->value]);

    $date = Carbon::tomorrow()->format('Y-m-d');
    $override = BusinessHourOverride::create([
        'date' => $date,
        'is_closed' => true,
    ]);

    $this->actingAs($admin)
        ->delete(route('business-hours.overrides.destroy', $override))
        ->assertRedirect();

    expect(BusinessHourOverride::count())->toBe(0);
});

it('permite reservar un corte de 50 minutos el martes 29 con horario especial de 10 a 13', function (bool $weeklyOpen) {
    $this->travelTo(Carbon::parse('2026-09-24 12:00:00'));
    Notification::fake();
    $admin = User::factory()->create(['role' => UserRoles::Admin, 'name' => 'Julian Valdivia']);
    $client = User::factory()->create(['role' => UserRoles::User]);
    $service = Service::factory()->create(['name' => 'Corte de Cabeio', 'duration' => 50, 'active' => true]);
    BusinessHour::factory()->create(['day_of_week' => 1, 'active' => $weeklyOpen, 'open_time' => '04:00', 'close_time' => '20:00']);

    $this->actingAs($admin)->post(route('business-hours.overrides.store'), [
        'date' => '2026-09-29', 'open_time' => '10:00', 'close_time' => '13:00', 'is_closed' => false,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $this->actingAs($client)->getJson(route('appointments.availability', [
        'date' => '2026-09-29', 'worker_id' => $admin->id, 'services' => [$service->id],
    ]))->assertOk()->assertExactJson(['slots' => ['10:00', '10:30', '11:00', '11:30', '12:00']]);

    $this->post(route('appointments.store'), [
        'date' => '2026-09-29', 'time' => '12:00', 'worker_id' => $admin->id, 'services' => [$service->id],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $this->assertDatabaseHas('appointments', ['user_id' => $client->id, 'worker_id' => $admin->id, 'starts_at' => '2026-09-29 12:00:00']);
})->with([true, false]);

it('no permite una excepción abierta sin ambas horas', function (array $times) {
    $admin = User::factory()->create(['role' => UserRoles::Admin]);

    $this->actingAs($admin)->postJson(route('business-hours.overrides.store'), [
        'date' => '2026-09-29', 'is_closed' => false, ...$times,
    ])->assertUnprocessable();

    expect(BusinessHourOverride::count())->toBe(0);
})->with([
    'sin horas' => [[]],
    'sin apertura' => [['close_time' => '13:00']],
    'sin cierre' => [['open_time' => '10:00']],
]);

it('guarda cambios de horario por JSON y actualiza inmediatamente la disponibilidad', function () {
    $this->travelTo(Carbon::parse('2026-09-24 12:00:00'));
    $admin = User::factory()->create(['role' => UserRoles::Admin]);
    $service = Service::factory()->create(['duration' => 50, 'active' => true]);
    $payload = ['day_of_week' => 1, 'open_time' => '10:00', 'close_time' => '13:00', 'active' => true];
    $response = $this->actingAs($admin)->postJson(route('business-hours.store'), $payload)->assertOk();
    $this->postJson(route('business-hours.store'), $payload)->assertOk()->assertJsonPath('id', $response->json('id'));
    expect(BusinessHour::count())->toBe(1);

    $this->putJson(route('business-hours.update', $response->json('id')), [...$payload, 'close_time' => '11:00'])->assertOk()->assertJsonPath('close_time', '11:00');
    $query = ['date' => '2026-09-29', 'worker_id' => $admin->id, 'services' => [$service->id]];
    $this->getJson(route('appointments.availability', $query))->assertExactJson(['slots' => ['10:00']]);

    $override = BusinessHourOverride::factory()->create(['date' => '2026-09-29', 'is_closed' => true]);
    $this->putJson(route('business-hours.overrides.update', $override), [
        'date' => '2026-09-29', 'is_closed' => false, 'open_time' => '12:00', 'close_time' => '13:00',
    ])->assertOk()->assertJsonPath('date', '2026-09-29');
    $this->getJson(route('appointments.availability', $query))->assertExactJson(['slots' => ['12:00']]);

    $this->putJson(route('business-hours.overrides.update', $override), [
        'date' => '2026-09-29', 'is_closed' => true,
    ])->assertOk();
    $this->getJson(route('appointments.availability', $query))->assertExactJson(['slots' => []]);
});
