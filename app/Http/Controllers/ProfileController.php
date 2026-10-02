<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateNotificationPreferencesRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\UserRoles;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function notifications(UpdateNotificationPreferencesRequest $request): RedirectResponse
    {
        $data = $request->safe()->only('notification_sound');
        if ($request->boolean('prompt_dismissed')) {
            $data['notification_prompted_at'] = now();
        }
        $request->user()->forceFill($data)->save();

        return back();
    }

    /**
     * Página de "Mi cuenta": datos personales y cambio de contraseña.
     */
    public function index()
    {
        return Inertia::render('Dashboard/Profile/Profile', [
            'user' => auth()->user(),
            'portfolio' => in_array(auth()->user()->role, [UserRoles::Worker, UserRoles::Admin], true)
                ? auth()->user()->publicWorkerProfile() : null,
        ]);
    }

    /**
     * Actualiza nombre, correo y teléfono del usuario autenticado.
     */
    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();

        $user->update($request->validated());

        return back()->with('success', 'Cuenta actualizada correctamente.');
    }

    /**
     * Cambia la contraseña (solo desde el perfil, validando la actual).
     */
    public function password(UpdatePasswordRequest $request)
    {
        $request->user()->update([
            'password' => $request->input('password'),
        ]);

        return back()->with('success', 'Contraseña actualizada correctamente.');
    }
}
