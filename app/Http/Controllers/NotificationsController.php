<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    /**
     * Polling de la app abierta: devuelve notificaciones nuevas desde "after".
     */
    public function latest(Request $request)
    {
        $data = $request->validate([
            'after' => ['nullable', 'date'],
        ]);

        $query = $request->user()->notifications();

        if (! empty($data['after'])) {
            $query->where('created_at', '>', $data['after']);
        }

        return response()->json([
            'notifications' => $query
                ->orderByDesc('created_at')
                ->limit(20)
                ->get()
                ->map(fn ($notification) => [
                    'id' => $notification->id,
                    'data' => $notification->data,
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at,
                ]),
        ]);
    }

    /**
     * Marca todas las notificaciones del usuario como leídas.
     */
    public function markAllRead()
    {
        request()->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }
}
