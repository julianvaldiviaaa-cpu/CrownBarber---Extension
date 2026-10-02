<?php

use App\Models\Appointment;
use App\Models\PushSubscription;
use App\Models\User;
use App\Notifications\AppointmentConfirmed;
use App\Services\WebPushChannel;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Minishlink\WebPush\MessageSentReport;
use Minishlink\WebPush\VAPID;
use Minishlink\WebPush\WebPush;

function browserSubscription(): array
{
    return ['endpoint' => 'https://fcm.googleapis.com/fcm/send/test-token', 'keys' => ['p256dh' => str_repeat('A', 87), 'auth' => str_repeat('B', 22)]];
}

beforeEach(function () {
    config(['services.webpush.public_key' => 'public', 'services.webpush.private_key' => 'private']);
});

it('guarda la suscripción y la vincula únicamente a la cuenta actual', function () {
    $first = User::factory()->create();
    $second = User::factory()->create();
    $this->actingAs($first)->postJson(route('notifications.push.store'), browserSubscription())->assertOk()->assertCookie('browser_push_id');
    $this->actingAs($second)->postJson(route('notifications.push.store'), browserSubscription())->assertOk();
    expect(PushSubscription::count())->toBe(1)
        ->and(PushSubscription::first()->user_id)->toBe($second->id)
        ->and($second->fresh()->notification_prompted_at)->not->toBeNull();
});

it('rechaza endpoints ajenos a proveedores push y claves malformadas', function (array $data, string $field) {
    $this->actingAs(User::factory()->create())->postJson(route('notifications.push.store'), array_replace_recursive(browserSubscription(), $data))
        ->assertUnprocessable()->assertJsonValidationErrors($field);
    expect(PushSubscription::count())->toBe(0);
})->with([
    [['endpoint' => ['invalid']], 'endpoint'],
    [['endpoint' => null], 'endpoint'],
    [['endpoint' => 'https://127.0.0.1/private'], 'endpoint'],
    [['endpoint' => 'http://fcm.googleapis.com/test'], 'endpoint'],
    [['endpoint' => 'https://fcm.googleapis.com.evil.com/test'], 'endpoint'],
    [['endpoint' => 'https://fcm.googleapis.com:8080/test'], 'endpoint'],
    [['keys' => ['auth' => 'invalid']], 'keys.auth'],
]);

it('no desactiva suscripciones de otras cuentas', function () {
    $owner = User::factory()->create();
    $data = browserSubscription();
    $subscription = $owner->pushSubscriptions()->create([...$data, 'endpoint_hash' => hash('sha256', $data['endpoint'])]);
    $this->actingAs(User::factory()->create())->withCredentials()->withCookie('browser_push_id', (string) $subscription->id)
        ->deleteJson(route('notifications.push.destroy'))->assertOk();
    expect($subscription->fresh())->not->toBeNull();
    $this->actingAs($owner)->withCookie('browser_push_id', (string) $subscription->id)->deleteJson(route('notifications.push.destroy'))->assertOk();
    expect($subscription->fresh())->toBeNull();
});

it('elimina la suscripción del dispositivo al cerrar sesión', function () {
    $user = User::factory()->create();
    $data = browserSubscription();
    $subscription = $user->pushSubscriptions()->create([...$data, 'endpoint_hash' => hash('sha256', $data['endpoint'])]);
    $this->actingAs($user)->withCookie('browser_push_id', (string) $subscription->id)->post(route('logout'))->assertRedirect(route('login'));
    expect($subscription->fresh())->toBeNull();
});

it('entrega datos de la interacción y elimina suscripciones expiradas', function () {
    $user = User::factory()->create();
    $appointment = Appointment::factory()->create(['user_id' => $user->id, 'starts_at' => '2026-09-23 12:00:00']);
    $notification = new AppointmentConfirmed($appointment, $appointment->worker);
    $notification->id = 'event-123';
    $appointment->update(['starts_at' => '2026-09-24 14:00:00']);
    $data = browserSubscription();
    $user->pushSubscriptions()->create([...$data, 'endpoint_hash' => hash('sha256', $data['endpoint'])]);
    $this->mock(WebPush::class)->shouldReceive('sendOneNotification')->once()->withArgs(function ($subscription, $payload) use ($user) {
        $event = json_decode($payload, true);

        return $event['recipient_id'] === $user->id && $event['starts_at'] === '2026-09-23 12:00:00'
            && $event['title'] === 'Cita confirmada' && isset($event['worker_name'], $event['services'], $event['url']);
    })->andReturn(new MessageSentReport(new Request('POST', $data['endpoint']), new Response(410), false));
    app(WebPushChannel::class)->send($user, $notification);
    expect($user->pushSubscriptions()->count())->toBe(0);
});

it('conserva suscripciones ante errores temporales para reintentar', function () {
    $user = User::factory()->create();
    $appointment = Appointment::factory()->create(['user_id' => $user->id]);
    $data = browserSubscription();
    $user->pushSubscriptions()->create([...$data, 'endpoint_hash' => hash('sha256', $data['endpoint'])]);
    $this->mock(WebPush::class)->shouldReceive('sendOneNotification')->once()->andReturn(new MessageSentReport(new Request('POST', $data['endpoint']), new Response(503), false));
    expect(fn () => app(WebPushChannel::class)->send($user, new AppointmentConfirmed($appointment)))->toThrow(RuntimeException::class);
    expect($user->pushSubscriptions()->count())->toBe(1);
});

it('requiere configuración del servidor y autenticación', function () {
    $this->postJson(route('notifications.push.store'), browserSubscription())->assertUnauthorized();
    config(['services.webpush.private_key' => null]);
    $this->actingAs(User::factory()->create())->postJson(route('notifications.push.store'), browserSubscription())->assertStatus(503);
});

it('cifra una entrega web push real sin hacer solicitudes de red', function () {
    $vapid = VAPID::createVapidKeys();
    $browser = VAPID::createVapidKeys();
    $requests = [];
    $handler = HandlerStack::create(new MockHandler([new Response(201)]));
    $handler->push(Middleware::history($requests));
    $webPush = new WebPush(['VAPID' => ['subject' => 'https://example.com', ...$vapid]], [], new Client(['handler' => $handler]));
    $this->app->instance(WebPush::class, $webPush);
    $user = User::factory()->create();
    $data = browserSubscription();
    $data['keys'] = ['p256dh' => $browser['publicKey'], 'auth' => rtrim(strtr(base64_encode(random_bytes(16)), '+/', '-_'), '=')];
    $user->pushSubscriptions()->create([...$data, 'endpoint_hash' => hash('sha256', $data['endpoint'])]);
    app(WebPushChannel::class)->send($user, new AppointmentConfirmed(Appointment::factory()->create(['user_id' => $user->id])));
    expect($requests)->toHaveCount(1)
        ->and($requests[0]['request']->getHeaderLine('Content-Encoding'))->toBe('aes128gcm')
        ->and($requests[0]['request']->getHeaderLine('Authorization'))->toStartWith('vapid ')
        ->and((string) $requests[0]['request']->getBody())->not->toContain('Cita confirmada');
});
