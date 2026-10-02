<?php

namespace App\Notifications;

use Illuminate\Support\Carbon;

class NewAppointmentRequest extends AppointmentNotification
{
    protected function eventType(): string
    {
        return 'new';
    }

    protected function title(object $notifiable): string
    {
        return 'Nueva solicitud de cita';
    }

    protected function message(object $notifiable): string
    {
        $at = Carbon::parse($this->appointment->starts_at)->format('d/m/Y H:i');

        return "{$this->actor?->name} agendó una cita para el {$at}.";
    }
}
