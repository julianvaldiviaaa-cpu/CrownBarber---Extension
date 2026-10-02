<?php

namespace App\Notifications;

use Illuminate\Support\Carbon;

class AppointmentCancelled extends AppointmentNotification
{
    protected function eventType(): string
    {
        return 'cancelled';
    }

    protected function title(object $notifiable): string
    {
        return 'Cita cancelada';
    }

    protected function message(object $notifiable): string
    {
        $at = Carbon::parse($this->appointment->effectiveStart())->format('d/m/Y H:i');

        return "La cita para el {$at} fue cancelada.";
    }
}
