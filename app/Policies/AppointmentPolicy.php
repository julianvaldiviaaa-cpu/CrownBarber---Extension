<?php

namespace App\Policies;

use App\AppointmentStatus;
use App\Models\Appointment;
use App\Models\User;
use App\UserRoles;

class AppointmentPolicy
{
    /**
     * Un usuario solo puede ver las citas donde es cliente o barbero.
     */
    public function view(User $user, Appointment $appointment): bool
    {
        return $user->id === $appointment->user_id
            || $user->id === $appointment->worker_id;
    }

    /**
     * Solo los clientes (rol user) crean citas.
     */
    public function create(User $user): bool
    {
        return $user->role === UserRoles::User;
    }

    /**
     * El actor debe ser parte de la cita y la cita debe estar accionable.
     */
    protected function canRespond(User $user, Appointment $appointment): bool
    {
        $isParty = $user->id === $appointment->user_id
            || $user->id === $appointment->worker_id;

        if (! $isParty || in_array($appointment->status, [AppointmentStatus::Cancelled, AppointmentStatus::Completed], true)) {
            return false;
        }

        return true;
    }

    /**
     * Confirma la cita: el barbero confirma las "pending"; en estado
     * "proposed" el actor es quien NO propuso la última hora.
     */
    public function confirm(User $user, Appointment $appointment): bool
    {
        if (! $this->canRespond($user, $appointment)) {
            return false;
        }

        return match ($appointment->status) {
            AppointmentStatus::Pending => $user->id === $appointment->worker_id,
            AppointmentStatus::Proposed => $appointment->proposed_by !== null
                && $user->id !== $appointment->proposed_by,
            default => false,
        };
    }

    /**
     * Rechaza/cancela la cita: mismas reglas que "confirm".
     */
    public function reject(User $user, Appointment $appointment): bool
    {
        return $this->confirm($user, $appointment);
    }

    /**
     * Propone una nueva hora: solo sobre citas no confirmadas ni canceladas,
     * y el actor no puede proponer dos veces seguidas.
     */
    public function propose(User $user, Appointment $appointment): bool
    {
        if (! $this->canRespond($user, $appointment)) {
            return false;
        }

        return match ($appointment->status) {
            AppointmentStatus::Pending => $user->id === $appointment->worker_id,
            AppointmentStatus::Proposed => $appointment->proposed_by !== null
                && $user->id !== $appointment->proposed_by,
            default => false,
        };
    }

    /**
     * Cancelar una cita confirmada (o en negociación) futura por cualquiera
     * de las dos partes.
     */
    public function cancel(User $user, Appointment $appointment): bool
    {
        if (! $this->canRespond($user, $appointment)) {
            return false;
        }

        if ($appointment->status === AppointmentStatus::Confirmed) {
            return $appointment->effectiveStart()->isFuture();
        }

        return $appointment->status !== AppointmentStatus::Cancelled;
    }

    public function complete(User $user, Appointment $appointment): bool
    {
        return $user->id === $appointment->worker_id
            && in_array($user->role, [UserRoles::Worker, UserRoles::Admin], true)
            && $appointment->status === AppointmentStatus::Confirmed
            && $appointment->starts_at->copy()->addMinutes($appointment->total_duration)->isPast();
    }
}
