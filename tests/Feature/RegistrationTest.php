<?php

use App\Models\User;
use Illuminate\Contracts\Validation\UncompromisedVerifier;
use Illuminate\Support\Facades\Notification;

it('registra e inicia sesión sin verificar el correo', function () {
    Notification::fake();
    $this->mock(UncompromisedVerifier::class)->shouldReceive('verify')->andReturnTrue();
    $this->post(route('register.store'), [
        'name' => 'Cliente', 'email' => 'crown.new@gmail.com', 'phone' => '5512345678',
        'password' => 'Secure!9753xyz', 'password_confirmation' => 'Secure!9753xyz',
    ])->assertSessionHasNoErrors()->assertRedirect(route('dashboard'));
    $this->assertAuthenticated();
    Notification::assertNothingSent();
    $this->get(route('dashboard'))->assertOk()->assertInertia(fn ($page) => $page
        ->where('auth.user.email_verified_at', null)->where('auth.user.notification_prompted_at', null));
});

it('permite a cuentas sin verificar usar la aplicación', function (string $route) {
    $this->actingAs(User::factory()->unverified()->create())->get(route($route))->assertOk();
})->with(['dashboard', 'appointments', 'appointments.create', 'profile', 'notifications.latest']);

it('guarda sonido y descarta el modal sin modificar otros datos', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->put(route('profile.notifications'), ['notification_sound' => false, 'prompt_dismissed' => true, 'role' => 'admin'])->assertRedirect();
    expect($user->fresh()->notification_sound)->toBeFalse()
        ->and($user->fresh()->notification_prompted_at)->not->toBeNull()
        ->and($user->fresh()->role)->toBe($user->role);
});
