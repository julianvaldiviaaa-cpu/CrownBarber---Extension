<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Excepción de horario por fecha concreta (festivo, cierre, horario especial).
 *
 * @property int $id
 * @property Carbon $date
 * @property string|null $open_time
 * @property string|null $close_time
 * @property bool $is_closed
 */
#[Fillable(['date', 'open_time', 'close_time', 'is_closed'])]
class BusinessHourOverride extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'is_closed' => 'boolean',
        ];
    }

    /**
     * Serializa la fecha en "Y-m-d" para que el frontend no la desplace por zona horaria.
     */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d');
    }

    public static function forDate(Carbon $date): ?self
    {
        return static::query()
            ->where('date', $date->toDateString())
            ->first();
    }
}
