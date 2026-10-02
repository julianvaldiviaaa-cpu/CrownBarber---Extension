<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\BusinessHour;
use App\Models\BusinessHourOverride;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Centraliza toda la lógica de disponibilidad de la barbería:
 * horarios de apertura (semanales + excepciones), generación de
 * slots y detección de conflictos por barbero.
 */
class BusinessHoursService
{
    /**
     * Paso en minutos entre cada slot de hora disponible.
     */
    public const SLOT_INTERVAL_MINUTES = 30;

    /**
     * Ventana [open, close] de un día concreto. Respeta las excepciones
     * por fecha; si no hay excepción, usa el horario semanal activo.
     *
     * @return array{open: Carbon, close: Carbon}|null null si el día está cerrado.
     */
    public function hoursForDate(Carbon $date): ?array
    {
        $override = BusinessHourOverride::forDate($date);

        if ($override !== null) {
            if ($override->is_closed || $override->open_time === null || $override->close_time === null) {
                return null;
            }

            return $this->windowFromTimes($date, $override->open_time, $override->close_time);
        }

        $hour = BusinessHour::forDate($date);

        if ($hour === null) {
            return null;
        }

        return $this->windowFromTimes($date, $hour->open_time, $hour->close_time);
    }

    /**
     * ¿La cita completa (inicio + duración) cabe dentro de la ventana de apertura?
     */
    public function isWithinHours(Carbon $startsAt, int $durationMinutes): bool
    {
        $window = $this->hoursForDate($startsAt->copy()->startOfDay());

        if ($window === null) {
            return false;
        }

        $end = $startsAt->copy()->addMinutes($durationMinutes);

        return $startsAt->gte($window['open']) && $end->lte($window['close']);
    }

    /**
     * Genera los slots de inicio disponibles para una fecha y duración,
     * comenzando siempre en el primer slot posterior a "now".
     *
     * @return Collection<int, string> horas en formato "H:i"
     */
    public function availableSlots(Carbon $date, int $durationMinutes, ?Carbon $now = null): Collection
    {
        $window = $this->hoursForDate($date->copy()->startOfDay());

        if ($window === null) {
            return collect();
        }

        $now = $now ?? Carbon::now();
        $slots = collect();
        $cursor = $window['open']->copy();
        $step = self::SLOT_INTERVAL_MINUTES;

        while ($cursor->lt($window['close'])) {
            $end = $cursor->copy()->addMinutes($durationMinutes);

            if ($end->lte($window['close']) && $cursor->gt($now)) {
                $slots->push($cursor->format('H:i'));
            }

            $cursor = $cursor->addMinutes($step);
        }

        return $slots;
    }

    /**
     * ¿El barbero ya tiene una cita que se solape con [startsAt, startsAt+duration)?
     */
    public function hasConflict(
        int $workerId,
        Carbon $startsAt,
        int $durationMinutes,
        ?Appointment $ignore = null,
    ): bool {
        $end = $startsAt->copy()->addMinutes($durationMinutes);

        // Ventana de búsqueda ampliada para no perder intervalos largos.
        $searchStart = $startsAt->copy()->subMinutes($durationMinutes);
        $searchEnd = $end->copy()->addMinutes($durationMinutes);

        return Appointment::query()
            ->where('worker_id', $workerId)
            ->activeBooking()
            ->when($ignore !== null, fn ($query) => $query->whereKeyNot($ignore->id))
            ->where(function ($query) use ($searchStart, $searchEnd) {
                $query->whereBetween('starts_at', [$searchStart, $searchEnd])
                    ->orWhereBetween('proposed_starts_at', [$searchStart, $searchEnd]);
            })
            ->get()
            ->contains(function (Appointment $existing) use ($startsAt, $end) {
                $existingStart = $existing->effectiveStart();
                $existingEnd = $existingStart->copy()->addMinutes($existing->total_duration);

                return $existingStart->lt($end) && $existingEnd->gt($startsAt);
            });
    }

    /**
     * Lista de bloques ocupados (inicio, fin) de un barbero en un día.
     *
     * @return Collection<int, array{start: Carbon, end: Carbon}>
     */
    public function busyBlocks(int $workerId, Carbon $date): Collection
    {
        $dayStart = $date->copy()->startOfDay();
        $dayEnd = $date->copy()->endOfDay();

        return Appointment::query()
            ->where('worker_id', $workerId)
            ->activeBooking()
            ->where(function ($query) use ($dayStart, $dayEnd) {
                $query->whereBetween('starts_at', [$dayStart, $dayEnd])
                    ->orWhereBetween('proposed_starts_at', [$dayStart, $dayEnd]);
            })
            ->get()
            ->map(fn (Appointment $appointment) => [
                'start' => $appointment->effectiveStart(),
                'end' => $appointment->effectiveStart()
                    ->copy()
                    ->addMinutes($appointment->total_duration),
            ]);
    }

    /**
     * Horas que quedan libres para un barbero en una fecha y duración dadas.
     *
     * @return Collection<int, string> horas en formato "H:i"
     */
    public function availableSlotsForWorker(
        int $workerId,
        Carbon $date,
        int $durationMinutes,
    ): Collection {
        return $this->availableSlots($date, $durationMinutes)
            ->reject(function (string $slot) use ($workerId, $date, $durationMinutes) {
                [$hour, $minute] = array_map('intval', explode(':', $slot));
                $startsAt = $date->copy()->startOfDay()->setTime($hour, $minute);

                return $this->hasConflict($workerId, $startsAt, $durationMinutes);
            })
            ->values();
    }

    protected function windowFromTimes(Carbon $date, string $openTime, string $closeTime): array
    {
        [$openHour, $openMinute] = array_map('intval', explode(':', $openTime));
        [$closeHour, $closeMinute] = array_map('intval', explode(':', $closeTime));

        return [
            'open' => $date->copy()->startOfDay()->setTime($openHour, $openMinute),
            'close' => $date->copy()->startOfDay()->setTime($closeHour, $closeMinute),
        ];
    }
}
