<?php

use App\Models\Appointment;
use App\Models\User;
use App\Notifications\AppointmentCancelled;
use App\Notifications\AppointmentConfirmed;
use App\UserRoles;

it('devuelve las notificaciones nuevas en el polling', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);

    $appointment = Appointment::factory()->pending()->create([
        'user_id' => $user->id,
        'worker_id' => $worker->id,
    ]);

    $user->notify(new AppointmentConfirmed($appointment));

    $response = $this->actingAs($user)
        ->get(route('notifications.latest'))
        ->assertOk();

    expect($response->json('notifications'))->toHaveCount(1);
    expect($response->json('notifications.0.data.appointment_id'))->toBe($appointment->id);
});

it('el polling filtra por el parámetro after', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);

    $appointment = Appointment::factory()->pending()->create([
        'user_id' => $user->id,
        'worker_id' => $worker->id,
    ]);

    $user->notify(new AppointmentCancelled($appointment));

    $response = $this->actingAs($user)
        ->get(route('notifications.latest', ['after' => now()->addHour()->format('Y-m-d H:i:s')]))
        ->assertOk();

    expect($response->json('notifications'))->toBe([]);
});

it('marca todas las notificaciones como leídas', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $worker = User::factory()->create(['role' => UserRoles::Worker->value]);

    $appointment = Appointment::factory()->pending()->create([
        'user_id' => $user->id,
        'worker_id' => $worker->id,
    ]);

    $user->notify(new AppointmentConfirmed($appointment));

    expect($user->unreadNotifications()->count())->toBe(1);

    $this->actingAs($user)
        ->post(route('notifications.read'))
        ->assertRedirect();

    expect($user->fresh()->unreadNotifications()->count())->toBe(0);
});
