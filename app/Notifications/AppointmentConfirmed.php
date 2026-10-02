<?php

namespace App\Notifications;

use Illuminate\Support\Carbon;

class AppointmentConfirmed extends AppointmentNotification
{
    protected function eventType(): string
    {
        return 'confirmed';
    }

    protected function title(object $notifiable): string
    {
        return 'Cita confirmada';
    }

    protected function message(object $notifiable): string
    {
        $at = Carbon::parse($this->appointment->effectiveStart())->format('d/m/Y H:i');

        return "Tu cita para el {$at} fue confirmada.";
    }
}
