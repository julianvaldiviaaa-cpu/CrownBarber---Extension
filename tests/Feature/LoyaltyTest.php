<?php

use App\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use App\Services\LoyaltyService;
use App\UserRoles;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->travelTo(now()->setTime(18, 0));
    $this->customer = User::factory()->create(['role' => UserRoles::User]);
    $this->barber = User::factory()->create(['role' => UserRoles::Worker]);
    $this->haircut = Service::factory()->create(['name' => 'Corte', 'price' => 180, 'loyalty_reward_type' => 'haircut']);
});

function loyaltyAppointment(User $customer, User $barber, Service $service, int $daysAgo = 0): Appointment
{
    $appointment = Appointment::factory()->confirmed()->create([
        'user_id' => $customer->id,
        'worker_id' => $barber->id,
        'starts_at' => now()->subDays($daysAgo)->setTime(10, 0),
        'total_price' => $service->price,
        'total_duration' => 30,
    ]);
    $appointment->services()->attach($service->id, ['price' => $service->price, 'name' => $service->name]);

    return $appointment;
}

function earnNineLoyaltyStamps(User $customer, User $barber, Service $service): void
{
    foreach (range(9, 1) as $daysAgo) {
        $appointment = loyaltyAppointment($customer, $barber, $service, $daysAgo);
        app(LoyaltyService::class)->complete($appointment, $barber, null);
    }
}

it('registra un solo sello por día incluso con varios barberos y citas', function () {
    $first = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $secondBarber = User::factory()->create(['role' => UserRoles::Worker]);
    $second = loyaltyAppointment($this->customer, $secondBarber, $this->haircut);
    $this->actingAs($this->barber)->post(route('appointments.complete', $first))->assertRedirect()->assertSessionHasNoErrors();
    $this->actingAs($secondBarber)->post(route('appointments.complete', $second))->assertRedirect()->assertSessionHasNoErrors();

    expect($first->fresh()->status)->toBe(AppointmentStatus::Completed)
        ->and($first->fresh()->completed_at)->not->toBeNull()
        ->and($second->fresh()->loyalty_visit_date)->toBeNull()
        ->and(app(LoyaltyService::class)->summary($this->customer)['stamps'])->toBe(1);
});

it('la décima visita descuenta solo un corte o facial y reinicia la tarjeta', function (string $type) {
    earnNineLoyaltyStamps($this->customer, $this->barber, $this->haircut);
    $reward = Service::factory()->create(['price' => 220, 'loyalty_reward_type' => $type]);
    $extra = Service::factory()->create(['price' => 75]);
    $appointment = loyaltyAppointment($this->customer, $this->barber, $reward);
    $appointment->services()->attach($extra->id, ['price' => 75, 'name' => $extra->name]);
    $appointment->update(['total_price' => 295]);
    $reward->update(['price' => 999]);

    $this->actingAs($this->barber)->post(route('appointments.complete', $appointment), [
        'loyalty_reward_service_id' => $reward->id,
        'total_price' => 0,
        'loyalty_discount' => 999,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $fresh = $appointment->fresh();
    expect($fresh->total_price)->toBe('75.00')
        ->and($fresh->loyalty_discount)->toBe('220.00')
        ->and($fresh->loyalty_reward_service_id)->toBe($reward->id)
        ->and($fresh->services()->find($reward->id)->pivot->price)->toEqual(220)
        ->and(app(LoyaltyService::class)->summary($this->customer))->toMatchArray([
            'stamps' => 0, 'rewards_available' => 0, 'rewards_redeemed' => 1, 'visits' => 10,
        ]);

    $this->post(route('appointments.complete', $appointment), ['loyalty_reward_service_id' => $reward->id])->assertForbidden();
    $next = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $this->post(route('appointments.complete', $next), ['loyalty_reward_service_id' => $this->haircut->id])->assertSessionHasErrors('loyalty_reward_service_id');
})->with(['haircut', 'facial']);

it('no admite premios antes de las nueve visitas', function () {
    $appointment = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $this->actingAs($this->barber)->post(route('appointments.complete', $appointment), ['loyalty_reward_service_id' => $this->haircut->id])->assertSessionHasErrors('loyalty_reward_service_id');
    expect($appointment->fresh()->status)->toBe(AppointmentStatus::Confirmed);
});

it('exige elegir el beneficio cuando la décima visita incluye un servicio elegible', function () {
    earnNineLoyaltyStamps($this->customer, $this->barber, $this->haircut);
    $appointment = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $this->actingAs($this->barber)->post(route('appointments.complete', $appointment))->assertSessionHasErrors('loyalty_reward_service_id');
    expect($appointment->fresh()->completed_at)->toBeNull();
});

it('rechaza premios ajenos a la cita o que no sean corte o facial', function (bool $attach) {
    earnNineLoyaltyStamps($this->customer, $this->barber, $this->haircut);
    $appointment = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $invalid = Service::factory()->create(['loyalty_reward_type' => $attach ? null : 'facial']);
    if ($attach) {
        $appointment->services()->attach($invalid->id, ['price' => 50, 'name' => $invalid->name]);
    }
    $this->actingAs($this->barber)->post(route('appointments.complete', $appointment), ['loyalty_reward_service_id' => $invalid->id])->assertSessionHasErrors('loyalty_reward_service_id');
    expect($appointment->fresh()->total_price)->toBe('180.00');
})->with([true, false]);

it('solo el barbero asignado puede completar una cita', function (string $role) {
    $appointment = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $actor = $role === 'customer' ? $this->customer : User::factory()->create(['role' => $role]);
    $this->actingAs($actor)->post(route('appointments.complete', $appointment))->assertForbidden();
    expect($appointment->fresh()->completed_at)->toBeNull();
})->with(['customer', 'worker', 'admin']);

it('no completa citas pendientes canceladas o futuras', function (string $state) {
    $appointment = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $appointment->update($state === 'future' ? ['starts_at' => now()->addHour()] : ['status' => $state]);
    $this->actingAs($this->barber)->post(route('appointments.complete', $appointment))->assertForbidden();
})->with(['pending', 'cancelled', 'future']);

it('no cuenta reservas ni servicios sin cobro', function () {
    loyaltyAppointment($this->customer, $this->barber, $this->haircut, 1)->update(['status' => AppointmentStatus::Pending]);
    $free = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $free->update(['total_price' => 0]);
    $this->actingAs($this->barber)->post(route('appointments.complete', $free))->assertSessionHasNoErrors();
    expect(app(LoyaltyService::class)->summary($this->customer)['stamps'])->toBe(0);
});

it('el noveno sello no se puede canjear en otra cita el mismo día', function () {
    foreach (range(8, 0) as $day) {
        app(LoyaltyService::class)->complete(loyaltyAppointment($this->customer, $this->barber, $this->haircut, $day), $this->barber, null);
    }
    $appointment = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $this->actingAs($this->barber)->post(route('appointments.complete', $appointment), ['loyalty_reward_service_id' => $this->haircut->id])->assertSessionHasErrors('loyalty_reward_service_id');
});

it('muestra la tarjeta privada y el historial solo al dueño', function () {
    earnNineLoyaltyStamps($this->customer, $this->barber, $this->haircut);
    $this->actingAs($this->customer)->get(route('loyalty'))->assertInertia(fn (Assert $page) => $page
        ->component('Dashboard/Loyalty')->where('loyalty.stamps', 9)->where('loyalty.rewards_available', 1)->has('history.data', 9));
    $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page->where('loyalty.stamps', 9));
    $other = User::factory()->create(['role' => UserRoles::User]);
    $this->actingAs($other)->get(route('loyalty'))->assertInertia(fn (Assert $page) => $page->where('loyalty.stamps', 0)->has('history.data', 0));
    $this->actingAs($this->barber)->get(route('loyalty'))->assertForbidden();
});

it('permite al administrador configurar los servicios elegibles', function () {
    $admin = User::factory()->create(['role' => UserRoles::Admin]);
    $data = ['name' => 'Facial', 'price' => 200, 'duration' => 30, 'loyalty_reward_type' => 'facial'];
    $this->actingAs($this->customer)->post(route('services.store'), $data)->assertForbidden();
    $this->actingAs($admin)->post(route('services.store'), $data)->assertRedirect()->assertSessionHasNoErrors();
    expect(Service::where('name', 'Facial')->firstOrFail()->loyalty_reward_type)->toBe('facial');
    $this->post(route('services.store'), [...$data, 'loyalty_reward_type' => 'tint'])->assertSessionHasErrors('loyalty_reward_type');
});

it('muestra el premio en la reserva y las acciones solo al barbero asignado', function () {
    earnNineLoyaltyStamps($this->customer, $this->barber, $this->haircut);
    $this->actingAs($this->customer)->get(route('appointments.create'))->assertInertia(fn (Assert $page) => $page
        ->where('loyalty.rewards_available', 1)->where('services.0.loyalty_reward_type', 'haircut'));
    $appointment = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $this->get(route('appointments.show', $appointment))->assertInertia(fn (Assert $page) => $page->where('canComplete', false));
    $this->actingAs($this->barber)->get(route('appointments.show', $appointment))->assertInertia(fn (Assert $page) => $page->where('canComplete', false)
        ->where('appointment.status', 'completed')->where('appointment.loyalty_discount', '180.00'));
});

it('conserva el beneficio si se elige otro servicio y permite un nuevo ciclo', function () {
    earnNineLoyaltyStamps($this->customer, $this->barber, $this->haircut);
    $beard = Service::factory()->create(['price' => 80, 'loyalty_reward_type' => null]);
    app(LoyaltyService::class)->complete(loyaltyAppointment($this->customer, $this->barber, $beard), $this->barber, null);
    $this->travel(1)->days();
    $rewardVisit = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    app(LoyaltyService::class)->complete($rewardVisit, $this->barber, $this->haircut->id);
    expect($rewardVisit->fresh()->total_price)->toBe('0.00')
        ->and(app(LoyaltyService::class)->summary($this->customer))->toMatchArray(['stamps' => 1, 'rewards_available' => 0]);
    $this->travel(3)->days();
    app(LoyaltyService::class)->complete(loyaltyAppointment($this->customer, $this->barber, $this->haircut), $this->barber, null);
    expect(app(LoyaltyService::class)->summary($this->customer)['stamps'])->toBe(2);
});

it('no permite canjear usando visitas que ocurrieron después de la cita', function () {
    earnNineLoyaltyStamps($this->customer, $this->barber, $this->haircut);
    $old = loyaltyAppointment($this->customer, $this->barber, $this->haircut, 20);
    $this->actingAs($this->barber)->post(route('appointments.complete', $old), ['loyalty_reward_service_id' => $this->haircut->id])
        ->assertSessionHasErrors('loyalty_reward_service_id');
    expect($old->fresh()->completed_at)->toBeNull();
});

it('mantiene los canjes consumidos al archivar una cita', function () {
    earnNineLoyaltyStamps($this->customer, $this->barber, $this->haircut);
    $rewardVisit = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    app(LoyaltyService::class)->complete($rewardVisit, $this->barber, $this->haircut->id);
    $rewardVisit->delete();
    expect(app(LoyaltyService::class)->summary($this->customer))->toMatchArray(['stamps' => 0, 'rewards_available' => 0, 'rewards_redeemed' => 1]);
});

it('incluye el facial configurado con precio y duración solicitados', function () {
    $facial = Service::where('slug', 'facial')->firstOrFail();

    expect($facial->name)->toBe('Facial')
        ->and($facial->price)->toBe('650.00')
        ->and($facial->duration)->toBe(75)
        ->and($facial->loyalty_reward_type)->toBe('facial')
        ->and($facial->active)->toBeTrue();
});

it('actualiza automáticamente una cita confirmada que ya terminó al abrir la tarjeta', function () {
    $appointment = loyaltyAppointment($this->customer, $this->barber, $this->haircut, 1);
    $this->actingAs($this->customer)->get(route('loyalty'))->assertInertia(fn (Assert $page) => $page
        ->where('loyalty.stamps', 1)->has('history.data', 1));
    expect($appointment->fresh()->status)->toBe(AppointmentStatus::Completed)
        ->and($appointment->fresh()->completed_at->format('H:i'))->toBe('10:30');
    $this->get(route('loyalty'))->assertInertia(fn (Assert $page) => $page->where('loyalty.stamps', 1));
    $this->artisan('loyalty:sync-visits')->expectsOutput('Visitas registradas: 0')->assertSuccessful();
});

it('sincroniza por fecha sin duplicar días y aplica el premio de mayor valor en la décima visita', function () {
    $appointments = [];
    foreach (range(9, 0) as $day) {
        $appointments[] = loyaltyAppointment($this->customer, $this->barber, $this->haircut, $day);
    }
    $duplicate = loyaltyAppointment($this->customer, $this->barber, $this->haircut, 9);
    $facial = Service::factory()->create(['price' => 650, 'loyalty_reward_type' => 'facial']);
    $tenth = $appointments[9];
    $tenth->services()->attach($facial->id, ['price' => 650, 'name' => $facial->name]);
    $tenth->update(['total_price' => 830]);
    $this->artisan('loyalty:sync-visits')->expectsOutput('Visitas registradas: 11')->assertSuccessful();
    expect(app(LoyaltyService::class)->summary($this->customer))->toMatchArray(['visits' => 10, 'stamps' => 0, 'rewards_redeemed' => 1])
        ->and($duplicate->fresh()->loyalty_visit_date)->toBeNull()
        ->and($tenth->fresh()->loyalty_discount)->toBe('650.00')
        ->and($tenth->fresh()->total_price)->toBe('180.00');
});

it('no registra citas en curso futuras pendientes o canceladas', function () {
    $ongoing = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $ongoing->update(['starts_at' => now()->subMinutes(10)]);
    $future = loyaltyAppointment($this->customer, $this->barber, $this->haircut);
    $future->update(['starts_at' => now()->addDay()]);
    loyaltyAppointment($this->customer, $this->barber, $this->haircut, 1)->update(['status' => AppointmentStatus::Pending]);
    loyaltyAppointment($this->customer, $this->barber, $this->haircut, 2)->update(['status' => AppointmentStatus::Cancelled]);
    expect(app(LoyaltyService::class)->summary($this->customer)['stamps'])->toBe(0)
        ->and($ongoing->fresh()->completed_at)->toBeNull()->and($future->fresh()->completed_at)->toBeNull();
});

it('actualiza también la lista del barbero y no usa citas de otros clientes para la tarjeta', function () {
    $appointment = loyaltyAppointment($this->customer, $this->barber, $this->haircut, 1);
    $other = User::factory()->create(['role' => UserRoles::User]);
    $this->actingAs($other)->get(route('loyalty'))->assertInertia(fn (Assert $page) => $page->where('loyalty.stamps', 0));
    expect($appointment->fresh()->status)->toBe(AppointmentStatus::Confirmed);
    $this->actingAs($this->barber)->get(route('appointments'))->assertInertia(fn (Assert $page) => $page->where('appointments.data.0.status', 'completed'));
    expect(app(LoyaltyService::class)->summary($this->customer)['stamps'])->toBe(1);
});
