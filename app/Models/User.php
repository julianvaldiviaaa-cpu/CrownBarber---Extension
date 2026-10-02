<?php

namespace App\Models;

use App\UserRoles;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $phone
 * @property UserRoles $role
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $specialty
 * @property string|null $description
 * @property string|null $profile_photo_path
 * @property string|null $cover_photo_path
 * @property string $profile_photo_url
 * @property string $cover_photo_url
 * @property array<int, array{id: string, path: string}>|null $work_gallery
 */
#[Fillable(['name', 'email', 'phone', 'role', 'password', 'branch_id'])]
#[Hidden(['password', 'remember_token', 'profile_photo_path', 'cover_photo_path', 'work_gallery'])]
class User extends Authenticatable
{
    protected $appends = ['profile_photo_url', 'cover_photo_url'];

    public function getProfilePhotoUrlAttribute(): string
    {
        return $this->profile_photo_path
            ? Storage::disk('public')->url($this->profile_photo_path)
            : '/worker-avatar.svg';
    }

    public function getCoverPhotoUrlAttribute(): string
    {
        return $this->cover_photo_path
            ? Storage::disk('public')->url($this->cover_photo_path)
            : '/worker-cover.svg';
    }

    /** @return array{id: int, name: string, specialty: ?string, description: ?string, profile_photo_url: string, cover_photo_url: string, gallery: array<int, array{id: string, url: string}>} */
    public function publicWorkerProfile(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'specialty' => $this->specialty,
            'description' => $this->description,
            'profile_photo_url' => $this->profile_photo_url,
            'cover_photo_url' => $this->cover_photo_url,
            'gallery' => array_map(fn (array $photo): array => [
                'id' => $photo['id'],
                'url' => Storage::disk('public')->url($photo['path']),
            ], $this->work_gallery ?? []),
        ];
    }

    protected $attributes = [
        'role' => 'user',
        'email_verified_at' => null,
        'notification_sound' => true,
        'notification_prompted_at' => null,
    ];

    /** @return HasMany<PushSubscription, $this> */
    public function pushSubscriptions(): HasMany
    {
        return $this->hasMany(PushSubscription::class);
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** @use HasFactory<UserFactory> */
    use HasFactory;

    use Notifiable;
    use SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRoles::class,
            'notification_sound' => 'boolean',
            'notification_prompted_at' => 'datetime',
            'work_gallery' => 'array',
        ];
    }
}
