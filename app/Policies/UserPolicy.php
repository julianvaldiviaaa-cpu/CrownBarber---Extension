<?php

namespace App\Policies;

use App\Models\User;
use App\UserRoles;

class UserPolicy
{
    public function updatePortfolio(User $user, User $worker): bool
    {
        return in_array($worker->role, [UserRoles::Worker, UserRoles::Admin], true)
            && ($user->role === UserRoles::Admin || $user->id === $worker->id);
    }

    /**
     * Determine whether the user can view any users.
     */
    public function viewAny(User $user): bool
    {
        return $user->role === UserRoles::Admin;
    }

    /**
     * Determine whether the user can view the user.
     */
    public function view(User $user, User $model): bool
    {
        return $user->role === UserRoles::Admin;
    }

    /**
     * Determine whether the user can create users.
     */
    public function create(User $user): bool
    {
        return $user->role === UserRoles::Admin;
    }

    /**
     * Determine whether the user can update the user.
     */
    public function update(User $user, User $model): bool
    {
        return $user->role === UserRoles::Admin;
    }

    /**
     * Determine whether the user can update the user's role.
     */
    public function updateRole(User $user, User $model): bool
    {
        return $user->role === UserRoles::Admin
            && $user->id !== $model->id;
    }

    /**
     * Determine whether the user can delete the user.
     */
    public function delete(User $user, User $model): bool
    {
        return $user->role === UserRoles::Admin
            && $user->id !== $model->id;
    }
}
