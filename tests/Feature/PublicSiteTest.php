<?php

use App\Models\BusinessHour;
use App\Models\Service;
use App\Models\User;
use App\UserRoles;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

it('muestra las páginas públicas sin iniciar sesión', function (string $route, string $component) {
    $this->get(route($route))->assertOk()->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    ['home', 'welcome'],
    ['public.services', 'Services'],
    ['public.barbers', 'Barbers'],
    ['public.experience', 'Experience'],
]);

it('publica solo servicios activos y no eliminados con sus precios reales', function (string $route) {
    $service = Service::factory()->create(['name' => 'Corte clásico', 'price' => 250, 'duration' => 45]);
    Service::factory()->create(['active' => false]);
    Service::factory()->create()->delete();

    $this->get(route($route))->assertInertia(fn (Assert $page) => $page
        ->has('services', 2)
        ->where('services.0.id', $service->id)
        ->where('services.0.price', '250.00')
        ->where('services.0.duration', 45)
        ->missing('services.0.deleted_at')
        ->where('services.1.name', 'Facial')
        ->where('services.1.price', '650.00')
        ->where('services.1.duration', 75));
})->with(['home', 'public.services']);

it('publica el equipo sin datos privados ni clientes ni cuentas eliminadas', function (string $route) {
    User::factory()->create(['role' => UserRoles::Worker]);
    User::factory()->create(['role' => UserRoles::Admin]);
    User::factory()->create(['role' => UserRoles::User]);
    User::factory()->create(['role' => UserRoles::Worker])->delete();

    $response = $this->get(route($route))->assertInertia(fn (Assert $page) => $page->has('barbers', 2));

    foreach ($response->inertiaProps('barbers') as $barber) {
        expect(array_keys($barber))->toBe(['id', 'name', 'specialty', 'description', 'profile_photo_url', 'cover_photo_url', 'gallery']);
    }
})->with(['home', 'public.barbers']);

it('muestra el horario configurado en la aplicación', function () {
    BusinessHour::factory()->create(['day_of_week' => 0, 'open_time' => '09:00', 'close_time' => '18:00', 'active' => true]);

    $this->get(route('public.experience'))->assertInertia(fn (Assert $page) => $page
        ->has('hours', 1)->where('hours.0.day_of_week', 0)->where('hours.0.active', true));
});

it('conserva la selección pública en el formulario de reserva', function () {
    $client = User::factory()->create(['role' => UserRoles::User]);
    $barber = User::factory()->create(['role' => UserRoles::Worker]);
    $service = Service::factory()->create();

    $this->actingAs($client)->get(route('appointments.create', ['service' => $service->id, 'barber' => $barber->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('selection.service', $service->id)->where('selection.barber', $barber->id));
});

it('ignora selecciones públicas que ya no están disponibles', function () {
    $client = User::factory()->create(['role' => UserRoles::User]);
    $service = Service::factory()->create(['active' => false]);

    $this->actingAs($client)->get(route('appointments.create', ['service' => $service->id, 'barber' => $client->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('selection.service', null)->where('selection.barber', null));
});

it('guarda el destino de reserva al pedir autenticación', function () {
    $destination = route('appointments.create', ['service' => 1]);

    $this->get($destination)->assertRedirect(route('login'))->assertSessionHas('url.intended', $destination);
});

it('vuelve a la reserva elegida después de iniciar sesión', function () {
    $client = User::factory()->create(['role' => UserRoles::User, 'email' => 'crown.test@gmail.com']);
    $destination = route('appointments.create', ['service' => 1]);

    $this->withSession(['url.intended' => $destination])->post(route('login.store'), [
        'email' => $client->email, 'password' => 'password',
    ])->assertRedirect($destination);

    $this->assertAuthenticatedAs($client);
});

it('vuelve a la reserva elegida después de verificar el correo', function () {
    $client = User::factory()->unverified()->create(['role' => UserRoles::User]);
    $destination = route('appointments.create', ['service' => 1]);
    $verification = URL::temporarySignedRoute('verification.verify', now()->addMinutes(10), [
        'id' => $client->id, 'hash' => sha1($client->email),
    ]);

    $this->actingAs($client)->withSession(['url.intended' => $destination])
        ->get($verification)->assertRedirect($destination);

    expect($client->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('la ruta de edición abre el formulario de servicio y aplica autorización', function () {
    $service = Service::factory()->create();
    $client = User::factory()->create(['role' => UserRoles::User]);
    $admin = User::factory()->create(['role' => UserRoles::Admin]);

    $this->actingAs($client)->get(route('services.edit', $service))->assertForbidden();
    $this->actingAs($admin)->get(route('services.edit', $service))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Dashboard/Roles/Admin/Services/ServiceShow'));
});
