<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutController extends Controller
{
    public function store(Request $request)
    {
        $request->user()->pushSubscriptions()->whereKey($request->cookie('browser_push_id'))->delete();
        Auth::logout();
        $request->session()->regenerate();

        return redirect()->route('login')->withoutCookie('browser_push_id');
    }
}
