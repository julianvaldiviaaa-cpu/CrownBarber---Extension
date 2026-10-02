<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pivot con snapshot: el precio/nombre del servicio se guarda tal
 * como estaba al momento de agendar la cita, aunque el servicio
 * cambie o se elimine después.
 *
 * @property int $id
 * @property int $appointment_id
 * @property int $service_id
 * @property string $price
 * @property string $name
 */
#[Fillable(['appointment_id', 'service_id', 'price', 'name'])]
class AppointmentService extends Model
{
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
