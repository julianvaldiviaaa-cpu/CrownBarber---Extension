<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePushSubscriptionRequest;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionsController extends Controller
{
    public function store(StorePushSubscriptionRequest $request): JsonResponse
    {
        abort_unless(config('services.webpush.public_key') && config('services.webpush.private_key'), 503, 'Las notificaciones push aún no están configuradas.');
        $data = $request->validated();
        $subscription = PushSubscription::updateOrCreate(
            ['endpoint_hash' => hash('sha256', $data['endpoint'])],
            [...$data, 'user_id' => $request->user()->id],
        );
        $request->user()->forceFill(['notification_prompted_at' => now()])->save();

        return response()->json(['enabled' => true])->withCookie(cookie('browser_push_id', (string) $subscription->id, 525600));
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->user()->pushSubscriptions()->whereKey($request->cookie('browser_push_id'))->delete();

        return response()->json(['enabled' => false])->withoutCookie('browser_push_id');
    }
}
