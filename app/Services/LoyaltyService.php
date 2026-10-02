<?php

namespace App\Services;

use App\AppointmentStatus;
use App\Models\Appointment;
use App\Models\User;
use App\UserRoles;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class LoyaltyService
{
    private const PAID_VISITS = 9;

    /** @return Builder<Appointment> */
    private function visits(User $user): Builder
    {
        return Appointment::withTrashed()->whereBelongsTo($user)
            ->where('status', AppointmentStatus::Completed)
            ->whereNotNull('loyalty_visit_date');
    }

    /** @return array{stamps: int, target: int, rewards_available: int, rewards_redeemed: int, visits: int} */
    public function summary(User $user): array
    {
        $this->synchronizeCustomer($user);

        return $this->countVisits($user);
    }

    /** @return array{stamps: int, target: int, rewards_available: int, rewards_redeemed: int, visits: int} */
    private function countVisits(User $user): array
    {
        $paid = $this->visits($user)->whereNull('loyalty_reward_service_id')->count();
        $redeemed = $this->visits($user)->whereNotNull('loyalty_reward_service_id')->count();
        $balance = max(0, $paid - $redeemed * self::PAID_VISITS);

        return [
            'stamps' => min(self::PAID_VISITS, $balance),
            'target' => 10,
            'rewards_available' => intdiv($balance, self::PAID_VISITS),
            'rewards_redeemed' => $redeemed,
            'visits' => $paid + $redeemed,
        ];
    }

    public function synchronize(?User $actor = null): int
    {
        $query = Appointment::query()->where('status', AppointmentStatus::Confirmed)
            ->where('starts_at', '<=', now());
        if ($actor !== null) {
            $query->where($actor->role === UserRoles::User ? 'user_id' : 'worker_id', $actor->id);
        }
        $customerIds = $query->distinct()->pluck('user_id');
        $count = 0;
        foreach (User::query()->whereIn('id', $customerIds)->get() as $customer) {
            $count += $this->synchronizeCustomer($customer);
        }

        return $count;
    }

    private function synchronizeCustomer(User $customer, ?string $before = null): int
    {
        return DB::transaction(function () use ($customer, $before): int {
            $customer = User::query()->lockForUpdate()->findOrFail($customer->id);
            $appointments = Appointment::query()->whereBelongsTo($customer)
                ->where('status', AppointmentStatus::Confirmed)->where('starts_at', '<=', now())
                ->when($before !== null, fn (Builder $query): Builder => $query->where('starts_at', '<', $before))
                ->orderBy('starts_at')->orderBy('id')->lockForUpdate()->get();
            $count = 0;
            foreach ($appointments as $appointment) {
                if ($appointment->starts_at->copy()->addMinutes($appointment->total_duration)->lte(now())) {
                    $this->recordVisit($appointment, $customer, null, true);
                    $count++;
                }
            }

            return $count;
        }, 3);
    }

    public function complete(Appointment $appointment, User $actor, ?int $rewardServiceId): void
    {
        DB::transaction(function () use ($appointment, $actor, $rewardServiceId): void {
            $customer = User::query()->lockForUpdate()->findOrFail($appointment->user_id);
            $appointment = Appointment::query()->lockForUpdate()->findOrFail($appointment->id);
            Gate::forUser($actor)->authorize('complete', $appointment);
            $this->synchronizeCustomer($customer, $appointment->starts_at->format('Y-m-d H:i:s'));
            $this->recordVisit($appointment, $customer, $rewardServiceId, false);
        }, 3);
    }

    private function recordVisit(Appointment $appointment, User $customer, ?int $rewardServiceId, bool $automatic): void
    {
        $date = $appointment->starts_at->toDateString();
        $alreadyVisited = $this->visits($customer)->whereDate('loyalty_visit_date', $date)->exists();
        $summary = $this->countVisits($customer);
        $eligible = $appointment->services()->whereIn('loyalty_reward_type', ['haircut', 'facial'])->get()
            ->filter(fn ($service): bool => (float) $service->pivot->getAttribute('price') > 0);
        $paidBefore = $this->visits($customer)->whereNull('loyalty_reward_service_id')
            ->whereDate('loyalty_visit_date', '<', $date)->count();
        $canRedeem = ! $alreadyVisited && $paidBefore - $summary['rewards_redeemed'] * self::PAID_VISITS >= self::PAID_VISITS;
        $reward = null;

        if ($automatic && $canRedeem) {
            $reward = $eligible->sortByDesc(fn ($service): float => (float) $service->pivot->getAttribute('price'))->first();
        } elseif ($rewardServiceId !== null) {
            if (! $canRedeem) {
                throw ValidationException::withMessages([
                    'loyalty_reward_service_id' => 'Necesitas nueve visitas pagadas en días anteriores y no haber registrado otra visita este día.',
                ]);
            }
            $reward = $eligible->firstWhere('id', $rewardServiceId);
            if ($reward === null) {
                throw ValidationException::withMessages([
                    'loyalty_reward_service_id' => 'Elige un corte de cabello o facial de esta cita habilitado como premio.',
                ]);
            }
        } elseif (! $automatic && $canRedeem && $eligible->isNotEmpty()) {
            throw ValidationException::withMessages([
                'loyalty_reward_service_id' => 'Este cliente tiene un premio disponible. Selecciona el corte o facial gratis antes de finalizar.',
            ]);
        }

        $discount = $reward === null ? 0 : (int) round((float) $reward->pivot->getAttribute('price') * 100);
        $total = (int) round((float) $appointment->total_price * 100);
        $appointment->update([
            'status' => AppointmentStatus::Completed,
            'completed_at' => $automatic ? $appointment->starts_at->copy()->addMinutes($appointment->total_duration) : now(),
            'loyalty_visit_date' => ! $alreadyVisited && ($total > 0 || $reward !== null) ? $date : null,
            'loyalty_reward_service_id' => $reward?->id,
            'loyalty_reward_name' => $reward?->pivot->getAttribute('name'),
            'loyalty_discount' => $discount / 100,
            'total_price' => max(0, $total - $discount) / 100,
        ]);
    }
}
