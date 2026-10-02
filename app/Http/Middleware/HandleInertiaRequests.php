<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'pushPublicKey' => config('services.webpush.private_key') ? config('services.webpush.public_key') : null,
                'pushEnabled' => fn () => $request->user()?->pushSubscriptions()->whereKey($request->cookie('browser_push_id'))->exists() ?? false,
                'notifications' => fn () => $request->user()
                    ? $request->user()->notifications()
                        ->orderByDesc('created_at')
                        ->limit(10)
                        ->get()
                        ->map(fn ($notification) => [
                            'id' => $notification->id,
                            'data' => $notification->data,
                            'read_at' => $notification->read_at?->format('Y-m-d H:i:s'),
                            'created_at' => $notification->created_at->format('Y-m-d H:i:s'),
                        ])
                    : [],
                'unreadNotificationsCount' => fn () => $request->user()?->unreadNotifications()->count() ?? 0,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
