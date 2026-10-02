<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\AppointmentNotification;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use RuntimeException;

class WebPushChannel
{
    public function send(User $notifiable, AppointmentNotification $notification): void
    {
        if (! config('services.webpush.public_key') || ! config('services.webpush.private_key') || ! $notifiable->pushSubscriptions()->exists()) {
            return;
        }

        $webPush = app(WebPush::class);

        $payload = json_encode([
            ...$notification->toArray($notifiable),
            'id' => $notification->id,
            'recipient_id' => $notifiable->id,
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);

        $failed = false;
        foreach ($notifiable->pushSubscriptions()->cursor() as $subscription) {
            $report = $webPush->sendOneNotification(Subscription::create([
                'endpoint' => $subscription->endpoint,
                'keys' => $subscription->keys,
                'contentEncoding' => 'aes128gcm',
            ]), $payload);

            if ($report->isSubscriptionExpired()) {
                $subscription->delete();
            } elseif (! $report->isSuccess()) {
                $failed = true;
            }
        }

        if ($failed) {
            throw new RuntimeException('No se pudieron entregar algunas notificaciones push.');
        }
    }
}
