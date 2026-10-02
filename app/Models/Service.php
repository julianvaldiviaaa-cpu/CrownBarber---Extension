<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Summary of Service
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property string $price
 * @property int $duration
 * @property bool $active
 * @property string $slug
 * @property-read Pivot $pivot When loaded through an appointment.
 */
#[Fillable(['name', 'description', 'price', 'duration', 'active', 'slug', 'loyalty_reward_type'])]
class Service extends Model
{
    use HasFactory;
    use SoftDeletes;

    /** @return BelongsToMany<Branch, $this, Pivot> */
    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class);
    }

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'duration' => 'integer',
            'active' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Service $service) {
            $service->slug = static::generateUniqueSlug($service->name);
        });

        static::updating(function (Service $service) {
            if ($service->isDirty('name')) {
                $service->slug = static::generateUniqueSlug($service->name, $service->id);
            }
        });
    }

    protected static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $count = 1;

        while (
            static::when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = "{$originalSlug}-{$count}";
            $count++;
        }

        return $slug;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
