<?php

namespace App\Models;

use App\AppointmentStatus;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $worker_id
 * @property Carbon $starts_at
 * @property AppointmentStatus $status
 * @property string $total_price
 * @property int $total_duration
 * @property Carbon|null $proposed_starts_at
 * @property int|null $proposed_by
 * @property int|null $cancelled_by
 * @property Carbon|null $completed_at
 * @property Carbon|null $loyalty_visit_date
 * @property int|null $loyalty_reward_service_id
 * @property string|null $loyalty_reward_name
 * @property string $loyalty_discount
 * @property User $user
 * @property User $worker
 * @property User|null $proposer
 * @property User|null $canceller
 * @property Collection<int, Service> $services
 */
#[Fillable([
    'user_id',
    'worker_id',
    'branch_id',
    'starts_at',
    'status',
    'total_price',
    'total_duration',
    'proposed_starts_at',
    'proposed_by',
    'cancelled_by',
    'completed_at',
    'loyalty_visit_date',
    'loyalty_reward_service_id',
    'loyalty_reward_name',
    'loyalty_discount',
])]
class Appointment extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $attributes = ['loyalty_discount' => 0];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'completed_at' => 'datetime',
            'loyalty_visit_date' => 'date:Y-m-d',
            'loyalty_discount' => 'decimal:2',
            'proposed_starts_at' => 'datetime',
            'status' => AppointmentStatus::class,
            'total_price' => 'decimal:2',
            'total_duration' => 'integer',
        ];
    }

    /** @param array<string, string|null> $filters */
    public function scopeFiltered(Builder $query, array $filters): Builder
    {
        foreach (['date_from' => '>=', 'date_to' => '<='] as $field => $operator) {
            if (! empty($filters[$field])) {
                $query->whereDate('starts_at', $operator, $filters[$field]);
            }
        }

        foreach (['time_from' => '>=', 'time_to' => '<='] as $field => $operator) {
            if (! empty($filters[$field])) {
                $query->whereTime('starts_at', $operator, $filters[$field].($field === 'time_to' ? ':59' : ':00'));
            }
        }

        return $query;
    }

    /**
     * Cliente que reservó la cita.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Barbero asignado (rol worker o admin).
     */
    public function worker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'worker_id');
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Quién propuso la última hora alternativa.
     */
    public function proposer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'proposed_by');
    }

    /**
     * Quién canceló la cita.
     */
    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * Servicios de la cita con el snapshot de precio/nombre al momento de agendar.
     *
     * @return BelongsToMany<Service, $this>
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'appointment_services')
            ->withPivot(['price', 'name'])
            ->withTimestamps();
    }

    /**
     * Serializa las fechas sin zona horaria (hora de muro del negocio) para que
     * el frontend no las desplace según la zona horaria del navegador.
     */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    /**
     * Hora a la que se realizará la cita: la propuesta aceptada o la original.
     */
    public function effectiveStart(): CarbonInterface
    {
        return $this->proposed_starts_at ?? $this->starts_at;
    }

    /**
     * Solo citas que siguen ocupando agenda (no canceladas).
     */
    public function scopeActiveBooking($query)
    {
        return $query->whereIn('status', [
            AppointmentStatus::Pending->value,
            AppointmentStatus::Proposed->value,
            AppointmentStatus::Confirmed->value,
        ]);
    }
}
