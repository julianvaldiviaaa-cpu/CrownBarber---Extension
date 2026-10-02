<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\User;
use App\Services\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Base de las notificaciones de citas. Se entrega en la app
 * (canal "database" → campanita de notificaciones).
 */
abstract class AppointmentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [10, 60, 300];

    /** @var array<string, mixed> */
    protected array $payload;

    public function __construct(
        public readonly Appointment $appointment,
        public readonly ?User $actor = null,
    ) {
        $this->appointment->loadMissing(['user', 'worker', 'services']);
        $this->payload = [
            'appointment_id' => $appointment->id,
            'type' => $this->eventType(),
            'title' => $this->title($appointment),
            'message' => $this->message($appointment),
            'starts_at' => $appointment->effectiveStart()->toDateTimeString(),
            'actor_name' => $actor?->name,
            'client_name' => $appointment->user?->name,
            'worker_name' => $appointment->worker?->name,
            'services' => $appointment->services->map(fn ($service) => $service->pivot->name)->all(),
            'total_price' => $appointment->total_price,
            'total_duration' => $appointment->total_duration,
            'url' => $this->url(),
        ];
    }

    /**
     * @return array<int, class-string>
     */
    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    /** @return array<string, string> */
    public function viaConnections(): array
    {
        return ['database' => 'sync'];
    }

    /**
     * Datos que se guardan en la tabla notifications (campanita).
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->payload;
    }

    protected function url(): string
    {
        return route('appointments.show', $this->appointment);
    }

    abstract protected function eventType(): string;

    abstract protected function title(object $notifiable): string;

    abstract protected function message(object $notifiable): string;
}
