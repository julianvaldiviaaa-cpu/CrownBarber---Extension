<?php

namespace App\Notifications;

use Illuminate\Support\Carbon;

class AppointmentTimeProposed extends AppointmentNotification
{
    protected function eventType(): string
    {
        return 'proposed';
    }

    protected function title(object $notifiable): string
    {
        return 'Nueva hora propuesta para tu cita';
    }

    protected function message(object $notifiable): string
    {
        $at = Carbon::parse($this->appointment->proposed_starts_at)->format('d/m/Y H:i');

        return "{$this->actor?->name} propuso la hora {$at}. Confirma, rechaza o sugiere otra.";
    }
}
