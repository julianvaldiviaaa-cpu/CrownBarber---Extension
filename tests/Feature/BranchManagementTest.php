<?php

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\BusinessHour;
use App\Models\Service;
use App\Models\User;
use App\UserRoles;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

it('permite solo a administradores administrar sucursales y asignaciones', function () {
    $admin = User::factory()->create(['role' => UserRoles::Admin]);
    $worker = User::factory()->create(['role' => UserRoles::Worker]);
    $customer = User::factory()->create(['role' => UserRoles::User]);
    $service = Service::factory()->create();

    $this->actingAs($customer)->get(route('branches'))->assertForbidden();
    $this->actingAs($worker)->post(route('branches.store'), ['name' => 'Centro'])->assertForbidden();
    $this->actingAs($worker)->patch(route('branches.workers', $worker), ['branch_id' => Branch::first()->id])->assertForbidden();

    $this->actingAs($admin)->post(route('branches.store'), ['name' => 'Centro', 'address' => 'Calle 1'])->assertRedirect();
    $branch = Branch::where('name', 'Centro')->firstOrFail();

    $this->actingAs($admin)->patch(route('branches.workers', $worker), ['branch_id' => $branch->id])->assertRedirect();
    $this->actingAs($admin)->put(route('branches.services', $branch), ['services' => [$service->id]])->assertRedirect();

    expect($worker->fresh()->branch_id)->toBe($branch->id);
    expect($branch->services()->pluck('services.id')->all())->toBe([$service->id]);
});

it('muestra servicios y barberos de la sucursal elegida y rechaza reservas cruzadas', function () {
    $customer = User::factory()->create(['role' => UserRoles::User]);
    $firstBranch = Branch::firstOrFail();
    $otherBranch = Branch::factory()->create();
    $worker = User::factory()->create(['role' => UserRoles::Worker, 'branch_id' => $otherBranch->id]);
    $service = Service::factory()->create();
    $otherBranch->services()->syncWithoutDetaching([$service->id]);

    $this->actingAs($customer)->get(route('appointments.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Appointments/AppointmentCreate')
            ->has('branches', 2)
            ->has('services')
            ->has('workers'));

    $day = Carbon::tomorrow();
    BusinessHour::create([
        'day_of_week' => ($day->dayOfWeek + 6) % 7,
        'open_time' => '09:00',
        'close_time' => '18:00',
        'active' => true,
    ]);

    $booking = [
        'branch_id' => $firstBranch->id,
        'worker_id' => $worker->id,
        'services' => [$service->id],
        'date' => $day->toDateString(),
        'time' => '10:00',
    ];

    $this->actingAs($customer)->post(route('appointments.store'), $booking)->assertSessionHasErrors('worker_id');
    expect(Appointment::count())->toBe(0);

    $this->actingAs($customer)->post(route('appointments.store'), [
        ...$booking,
        'branch_id' => $otherBranch->id,
    ])->assertRedirect();

    expect(Appointment::firstOrFail()->branch_id)->toBe($otherBranch->id);
});

it('impide mover un barbero con citas futuras a otra sucursal', function () {
    $admin = User::factory()->create(['role' => UserRoles::Admin]);
    $worker = User::factory()->create(['role' => UserRoles::Worker]);
    $otherBranch = Branch::factory()->create();
    Appointment::factory()->create([
        'worker_id' => $worker->id,
        'branch_id' => $worker->branch_id,
        'starts_at' => Carbon::tomorrow()->setTime(10, 0),
    ]);

    $this->actingAs($admin)->patch(route('branches.workers', $worker), [
        'branch_id' => $otherBranch->id,
    ])->assertSessionHas('error');

    expect($worker->fresh()->branch_id)->not->toBe($otherBranch->id);
});

it('publica solo servicios ofrecidos en una sucursal y muestra sus sedes', function () {
    $branch = Branch::factory()->create();
    $service = Service::factory()->create();
    $branch->services()->syncWithoutDetaching([$service->id]);
    $hiddenService = Service::factory()->create();
    $hiddenService->branches()->detach();

    $response = $this->get(route('public.services'))->assertInertia(fn (Assert $page) => $page->has('services', 2));
    $published = collect($response->inertiaProps('services'));

    expect($published->pluck('id'))->toContain($service->id)->not->toContain($hiddenService->id);
    expect($published->firstWhere('id', $service->id)['branches'])->toHaveCount(2);
});

it('permite elegir las sucursales de un servicio desde su formulario', function () {
    $admin = User::factory()->create(['role' => UserRoles::Admin]);
    $branch = Branch::factory()->create();

    $this->actingAs($admin)->post(route('services.store'), [
        'name' => 'Corte sucursal norte',
        'description' => 'Corte de cabello',
        'price' => 250,
        'duration' => 45,
        'branches' => [$branch->id],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $service = Service::where('name', 'Corte sucursal norte')->firstOrFail();
    expect($service->branches()->pluck('branches.id')->all())->toBe([$branch->id]);
});
