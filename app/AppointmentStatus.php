<?php

namespace App;

enum AppointmentStatus: string
{
    case Pending = 'pending';
    case Proposed = 'proposed';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';
    case Completed = 'completed';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(fn (self $case) => $case->value, self::cases());
    }

    /**
     * Estados en los que la cita sigue siendo una reserva válida
     * (ocupa la agenda del barbero y bloquea horarios).
     */
    public function isActive(): bool
    {
        return in_array($this, [self::Pending, self::Proposed, self::Confirmed], true);
    }
}
