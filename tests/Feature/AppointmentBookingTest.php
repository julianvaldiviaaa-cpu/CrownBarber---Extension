<?php

use App\AppointmentStatus;
use App\Models\Appointment;
use App\Models\BusinessHour;
use App\Models\Service;
use App\Models\User;
use App\Services\BusinessHoursService;
use App\UserRoles;
use Illuminate\Support\Carbon;

/**
 * Configura la barbería abierta todo el día de mañana y devuelve
 * una hora de inicio válida (futura, dentro de horario y sin conflicto).
 */
function setupOpenTomorrow(User $worker, int $durationMinutes): string
{
    $dayOfWeek = (Carbon::tomorrow()->dayOfWeek + 6) % 7;

    BusinessHour::create([
        'day_of_week' => $dayOfWeek,
        'open_time' => '00:01',
        'close_time' => '23:59',
        'active' => true,
    ]);

    return (string) app(BusinessHoursService::class)
        ->availableSlotsForWorker($worker->id, Carbon::tomorrow(), $durationMinutes)
        ->first();
}

it('solo los clientes pueden crear citas', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);
    $service = Service::factory()->create();

    $time = setupOpenTomorrow($worker, (int) $service->duration);

    $this->actingAs($user)->post(route('appointments.store'), [
        'worker_id' => $worker->id,
        'services' => [$service->id],
        'date' => Carbon::tomorrow()->format('Y-m-d'),
        'time' => $time,
    ])->assertRedirect();

    expect(Appointment::count())->toBe(1);
});

it('un barbero no puede crear citas', function () {
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);
    $service = Service::factory()->create();

    $this->actingAs($worker)->post(route('appointments.store'), [
        'worker_id' => $worker->id,
        'services' => [$service->id],
        'date' => Carbon::tomorrow()->format('Y-m-d'),
        'time' => '12:00',
    ])->assertForbidden();

    expect(Appointment::count())->toBe(0);
});

it('crea la cita con el snapshot de precio y duración de los servicios', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);
    $service = Service::factory()->create([
        'price' => 150.50,
        'duration' => 45,
        'active' => true,
    ]);

    $time = setupOpenTomorrow($worker, 45);

    $this->actingAs($user)->post(route('appointments.store'), [
        'worker_id' => $worker->id,
        'services' => [$service->id],
        'date' => Carbon::tomorrow()->format('Y-m-d'),
        'time' => $time,
    ])->assertRedirect();

    $appointment = Appointment::firstOrFail();

    expect($appointment->total_price)->toBe('150.50');
    expect($appointment->total_duration)->toBe(45);
    expect($appointment->status->value)->toBe('pending');
    expect($appointment->services()->first()->pivot->name)->toBe($service->name);
});

it('valida que la barbería esté abierta en la fecha elegida', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);
    $service = Service::factory()->create();

    $this->actingAs($user)->post(route('appointments.store'), [
        'worker_id' => $worker->id,
        'services' => [$service->id],
        'date' => Carbon::tomorrow()->format('Y-m-d'),
        'time' => '12:00',
    ])->assertSessionHasErrors('time');

    expect(Appointment::count())->toBe(0);
});

it('rechaza una hora que ya pasó', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);
    $service = Service::factory()->create();

    $this->actingAs($user)->post(route('appointments.store'), [
        'worker_id' => $worker->id,
        'services' => [$service->id],
        'date' => Carbon::yesterday()->format('Y-m-d'),
        'time' => '12:00',
    ])->assertSessionHasErrors('date');
});

it('rechaza una hora que solapa con otra cita del barbero', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);
    $service = Service::factory()->create(['duration' => 30]);

    $time = setupOpenTomorrow($worker, 30);

    // Primera cita que ocupa el mismo bloque.
    $startsAt = Carbon::parse(Carbon::tomorrow()->format('Y-m-d').' '.$time);

    Appointment::create([
        'user_id' => $user->id,
        'worker_id' => $worker->id,
        'starts_at' => $startsAt,
        'status' => AppointmentStatus::Confirmed,
        'total_price' => 0,
        'total_duration' => 30,
    ]);

    $this->actingAs($user)->post(route('appointments.store'), [
        'worker_id' => $worker->id,
        'services' => [$service->id],
        'date' => Carbon::tomorrow()->format('Y-m-d'),
        'time' => $time,
    ])->assertSessionHasErrors('time');
});

it('solo las partes pueden ver la cita', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);
    $outsider = User::factory()->create(['role' => UserRoles::User->value]);

    $appointment = Appointment::factory()->create([
        'user_id' => $user->id,
        'worker_id' => $worker->id,
    ]);

    $this->actingAs($outsider)->get(route('appointments.show', $appointment))->assertForbidden();
    $this->actingAs($user)->get(route('appointments.show', $appointment))->assertOk();
    $this->actingAs($worker)->get(route('appointments.show', $appointment))->assertOk();
});

it('el barbero confirma una cita pendiente', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);

    $appointment = Appointment::factory()->pending()->create([
        'user_id' => $user->id,
        'worker_id' => $worker->id,
    ]);

    $this->actingAs($worker)->post(route('appointments.confirm', $appointment))->assertRedirect();

    expect($appointment->fresh()->status->value)->toBe('confirmed');
});

it('el cliente no puede confirmar su propia cita pendiente', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);

    $appointment = Appointment::factory()->pending()->create([
        'user_id' => $user->id,
        'worker_id' => $worker->id,
    ]);

    $this->actingAs($user)->post(route('appointments.confirm', $appointment))->assertForbidden();

    expect($appointment->fresh()->status->value)->toBe('pending');
});

it('el barbero propone una nueva hora y el cliente la confirma', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);

    $appointment = Appointment::factory()->pending()->create([
        'user_id' => $user->id,
        'worker_id' => $worker->id,
        'total_duration' => 30,
    ]);

    $proposedAt = Carbon::tomorrow()->addDays(2)->setTime(11, 0);

    // El día propuesto debe estar dentro del horario de apertura.
    $proposedDayOfWeek = ($proposedAt->dayOfWeek + 6) % 7;

    BusinessHour::create([
        'day_of_week' => $proposedDayOfWeek,
        'open_time' => '09:00',
        'close_time' => '18:00',
        'active' => true,
    ]);

    $this->actingAs($worker)
        ->post(route('appointments.propose', $appointment), ['starts_at' => $proposedAt->format('Y-m-d H:i')])
        ->assertRedirect();

    $fresh = $appointment->fresh();
    expect($fresh->status->value)->toBe('proposed');
    expect($fresh->proposed_by)->toBe($worker->id);
    expect($fresh->proposed_starts_at->format('Y-m-d H:i'))->toBe($proposedAt->format('Y-m-d H:i'));

    // El barbero no puede confirmar su propia propuesta.
    $this->actingAs($worker)->post(route('appointments.confirm', $appointment))->assertForbidden();

    // El cliente la confirma y la cita adopta la hora propuesta.
    $this->actingAs($user)->post(route('appointments.confirm', $appointment))->assertRedirect();

    $confirmed = $appointment->fresh();
    expect($confirmed->status->value)->toBe('confirmed');
    expect($confirmed->starts_at->format('Y-m-d H:i'))->toBe($proposedAt->format('Y-m-d H:i'));
    expect($confirmed->proposed_starts_at)->toBeNull();
});

it('cualquiera de las partes puede cancelar una cita confirmada futura', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);

    $appointment = Appointment::factory()->confirmed()->create([
        'user_id' => $user->id,
        'worker_id' => $worker->id,
        'starts_at' => Carbon::tomorrow()->setTime(10, 0),
    ]);

    $this->actingAs($user)->post(route('appointments.cancel', $appointment))->assertRedirect();

    expect($appointment->fresh()->status->value)->toBe('cancelled');
    expect($appointment->fresh()->cancelled_by)->toBe($user->id);
});

it('no se puede cancelar una cita confirmada pasada', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);

    $appointment = Appointment::factory()->confirmed()->create([
        'user_id' => $user->id,
        'worker_id' => $worker->id,
        'starts_at' => Carbon::yesterday()->setTime(10, 0),
    ]);

    $this->actingAs($user)->post(route('appointments.cancel', $appointment))->assertForbidden();
});

it('el endpoint de disponibilidad devuelve slots respetando la apertura y los conflictos', function () {
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);
    $service = Service::factory()->create(['duration' => 30]);

    $dayOfWeek = (Carbon::tomorrow()->dayOfWeek + 6) % 7;
    BusinessHour::create([
        'day_of_week' => $dayOfWeek,
        'open_time' => '10:00',
        'close_time' => '11:00',
        'active' => true,
    ]);

    $date = Carbon::tomorrow()->format('Y-m-d');

    $response = $this->actingAs($worker)
        ->get(route('appointments.availability', [
            'date' => $date,
            'worker_id' => $worker->id,
            'services' => [$service->id],
        ]))
        ->assertOk();

    // En una ventana de una hora con servicios de 30 min caben dos slots.
    expect($response->json('slots'))->toBe(['10:00', '10:30']);
});
