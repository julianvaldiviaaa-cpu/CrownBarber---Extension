<?php

use App\Models\User;
use App\UserRoles;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

it('requiere autenticación para ver el perfil', function () {
    $this->get(route('profile'))->assertRedirect(route('login'));
});

it('muestra la página del perfil con los datos del usuario', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);

    $this->actingAs($user)
        ->get(route('profile'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard/Profile/Profile')
            ->where('user.name', $user->name));
});

it('actualiza el nombre, correo y teléfono del usuario', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);

    $this->actingAs($user)->put(route('profile.update'), [
        'name' => 'Nombre Nuevo',
        'email' => 'nuevo@example.com',
        'phone' => '+5215500000000',
    ])->assertRedirect();

    expect($user->fresh()->name)->toBe('Nombre Nuevo');
    expect($user->fresh()->email)->toBe('nuevo@example.com');
    expect($user->fresh()->phone)->toBe('+5215500000000');
});

it('no permite usar un correo que ya pertenece a otro usuario', function () {
    $user = User::factory()->create(['role' => UserRoles::User->value]);
    $other = User::factory()->create(['role' => UserRoles::User->value]);

    $this->actingAs($user)->put(route('profile.update'), [
        'name' => $user->name,
        'email' => $other->email,
        'phone' => $user->phone,
    ])->assertSessionHasErrors('email');

    expect($user->fresh()->email)->toBe($user->email);
});

it('al cambiar el correo no exige verificación ni envía correo', function () {
    Notification::fake();

    $user = User::factory()->create(['role' => UserRoles::User->value]);

    $this->actingAs($user)->put(route('profile.update'), [
        'name' => $user->name,
        'email' => 'nuevo@example.com',
        'phone' => $user->phone,
    ])->assertRedirect();

    Notification::assertNothingSent();
    $this->get(route('dashboard'))->assertOk();
});

it('rechaza el cambio de contraseña si la actual es incorrecta', function () {
    $user = User::factory()->create([
        'role' => UserRoles::User->value,
        'password' => 'Correcto1!',
    ]);

    $this->actingAs($user)->put(route('profile.password'), [
        'current_password' => 'incorrecta',
        'password' => 'Nueva123!',
        'password_confirmation' => 'Nueva123!',
    ])->assertSessionHasErrors('current_password');
});

it('cambia la contraseña validando la contraseña actual', function () {
    $user = User::factory()->create([
        'role' => UserRoles::User->value,
        'password' => 'Actual123!',
    ]);

    $this->actingAs($user)->put(route('profile.password'), [
        'current_password' => 'Actual123!',
        'password' => 'Nueva123!',
        'password_confirmation' => 'Nueva123!',
    ])->assertRedirect();

    expect(Hash::check('Nueva123!', $user->fresh()->password))->toBeTrue();
    expect(Hash::check('Actual123!', $user->fresh()->password))->toBeFalse();
});
