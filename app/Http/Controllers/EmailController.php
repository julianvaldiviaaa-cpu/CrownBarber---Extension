<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailController extends Controller
{
    public function notification()
    {
        return redirect()->intended(route('dashboard'));
    }

    public function verify(EmailVerificationRequest $request): RedirectResponse
    {
        $request->fulfill();

        return redirect()->intended(route('dashboard'))->with('success', 'Email Verificado Correctamente. Bienvenido');
    }

    public function send(Request $request)
    {
        return redirect()->intended(route('dashboard'));
    }
}
