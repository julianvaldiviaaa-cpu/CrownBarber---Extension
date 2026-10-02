<?php

namespace App\Policies;

use App\Models\BusinessHour;
use App\Models\BusinessHourOverride;
use App\Models\User;
use App\UserRoles;

class BusinessHourPolicy
{
    /**
     * Solo administradores gestionan los horarios de apertura.
     */
    public function viewAny(User $user): bool
    {
        return $user->role === UserRoles::Admin;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRoles::Admin;
    }

    public function update(User $user, BusinessHour $businessHour): bool
    {
        return $user->role === UserRoles::Admin;
    }

    public function delete(User $user, BusinessHour $businessHour): bool
    {
        return $user->role === UserRoles::Admin;
    }

    /**
     * Las excepciones por fecha comparten la misma regla: solo admin.
     */
    public function createOverride(User $user): bool
    {
        return $user->role === UserRoles::Admin;
    }

    public function updateOverride(User $user, BusinessHourOverride $override): bool
    {
        return $user->role === UserRoles::Admin;
    }

    public function deleteOverride(User $user, BusinessHourOverride $override): bool
    {
        return $user->role === UserRoles::Admin;
    }
}
