<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Horario semanal recurrente de la barbería.
 * day_of_week: 0 = Lunes ... 6 = Domingo.
 *
 * @property int $id
 * @property int $day_of_week
 * @property string $open_time
 * @property string $close_time
 * @property bool $active
 */
#[Fillable(['day_of_week', 'open_time', 'close_time', 'active'])]
class BusinessHour extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'active' => 'boolean',
        ];
    }

    /**
     * Los días de la semana ordenados, con sus etiquetas en español.
     *
     * @return array<int, array{value: int, label: string}>
     */
    public static function weekDays(): array
    {
        return [
            ['value' => 0, 'label' => 'Lunes'],
            ['value' => 1, 'label' => 'Martes'],
            ['value' => 2, 'label' => 'Miércoles'],
            ['value' => 3, 'label' => 'Jueves'],
            ['value' => 4, 'label' => 'Viernes'],
            ['value' => 5, 'label' => 'Sábado'],
            ['value' => 6, 'label' => 'Domingo'],
        ];
    }

    /**
     * Convierte un "day_of_week" de la BD a la misma base que Carbon
     * (Carbon usa 0 = Domingo; la BD usa 0 = Lunes).
     */
    public static function toCarbonDayOfWeek(int $dayOfWeek): int
    {
        return ($dayOfWeek + 1) % 7;
    }

    /**
     * Convierte un "dayOfWeek" de Carbon al día usado en la BD.
     */
    public static function fromCarbonDayOfWeek(int $carbonDayOfWeek): int
    {
        return ($carbonDayOfWeek + 6) % 7;
    }

    public static function forDate(Carbon $date): ?self
    {
        return static::query()
            ->where('day_of_week', static::fromCarbonDayOfWeek($date->dayOfWeek))
            ->where('active', true)
            ->first();
    }
}
