<?php

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

it('filtra citas propias antes de paginar', function (string $role, string $route) {
    $user = User::factory()->unverified()->create(['role' => $role]);
    $ownerColumn = $role === 'user' ? 'user_id' : 'worker_id';
    Appointment::factory()->count(12)->create([$ownerColumn => $user->id, 'starts_at' => '2026-09-23 10:30:00']);
    Appointment::factory()->create([$ownerColumn => $user->id, 'starts_at' => '2026-09-23 09:00:00']);
    Appointment::factory()->create([$ownerColumn => $user->id, 'starts_at' => '2026-09-24 10:30:00']);
    Appointment::factory()->create(['starts_at' => '2026-09-23 10:30:00']);
    $filters = ['date_from' => '2026-09-23', 'date_to' => '2026-09-23', 'time_from' => '10:30', 'time_to' => '10:30'];
    $this->actingAs($user)->get(route($route, $filters))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('appointments.total', 12)->has('appointments.data', 10)
        ->where('appointments.data.0.'.$ownerColumn, $user->id)
        ->where('filters.date_from', '2026-09-23')
        ->where('appointments.next_page_url', fn ($url) => str_contains($url, 'time_from=10%3A30')));
    $this->get(route($route, [...$filters, 'page' => 2]))->assertInertia(fn (Assert $page) => $page->has('appointments.data', 2));
})->with(['user', 'worker', 'admin'])->with(['appointments', 'dashboard']);

it('aplica los límites inclusivos del calendario del negocio', function (string $period, string $start, string $end) {
    $this->travelTo(Carbon::parse('2026-09-23 23:30:00'));
    $user = User::factory()->create();
    Appointment::factory()->create(['user_id' => $user->id, 'starts_at' => $start.' 00:00:00']);
    Appointment::factory()->create(['user_id' => $user->id, 'starts_at' => $end.' 23:59:59']);
    Appointment::factory()->create(['user_id' => $user->id, 'starts_at' => Carbon::parse($start)->subSecond()]);
    Appointment::factory()->create(['user_id' => $user->id, 'starts_at' => Carbon::parse($end)->addDay()]);
    $this->actingAs($user)->get(route('appointments', ['period' => $period]))->assertInertia(fn (Assert $page) => $page
        ->where('appointments.total', 2)->where('filters.date_from', $start)->where('filters.date_to', $end));
})->with([
    ['today', '2026-09-23', '2026-09-23'],
    ['week', '2026-09-21', '2026-09-27'],
    ['month', '2026-09-01', '2026-09-30'],
]);

it('rechaza filtros inválidos', function (array $filters, string $field) {
    $this->actingAs(User::factory()->create())->getJson(route('appointments', $filters))->assertUnprocessable()->assertJsonValidationErrors($field);
})->with([
    [['period' => 'year'], 'period'],
    [['date_from' => '2026-09-30', 'date_to' => '2026-09-01'], 'date_to'],
    [['time_from' => '16:00', 'time_to' => '10:00'], 'time_to'],
    [['time_from' => '25:00'], 'time_from'],
    [['date_from' => '2026-02-30'], 'date_from'],
]);

it('permite filtrar solo con el límite final', function () {
    $this->actingAs(User::factory()->create())->get(route('appointments', ['date_to' => '2026-09-23', 'time_to' => '12:00']))->assertOk();
});
