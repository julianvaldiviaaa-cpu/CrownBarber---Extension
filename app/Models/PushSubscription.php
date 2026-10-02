<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PushSubscription extends Model
{
    protected $table = 'browser_push_subscriptions';

    protected $fillable = ['user_id', 'endpoint', 'endpoint_hash', 'keys'];

    protected $hidden = ['endpoint', 'keys'];

    protected function casts(): array
    {
        return ['keys' => 'array'];
    }
}
