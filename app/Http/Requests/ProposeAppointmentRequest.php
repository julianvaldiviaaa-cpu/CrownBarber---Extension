<?php

namespace App\Http\Requests;

use App\Services\BusinessHoursService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

class ProposeAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'starts_at' => [
                'required',
                'date_format:Y-m-d H:i',
            ],
        ];
    }

    /**
     * La propuesta debe respetar las mismas reglas que una cita nueva.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $appointment = $this->route('appointment');

                $startsAt = Carbon::parse($this->input('starts_at'));
                $businessHours = app(BusinessHoursService::class);

                if ($startsAt->isPast()) {
                    $validator->errors()->add(
                        'starts_at',
                        'La hora propuesta ya pasó. Elige una hora futura.'
                    );

                    return;
                }

                if (! $businessHours->isWithinHours($startsAt, $appointment->total_duration)) {
                    $validator->errors()->add(
                        'starts_at',
                        'La hora propuesta está fuera del horario de apertura de la barbería.'
                    );

                    return;
                }

                if ($businessHours->hasConflict(
                    $appointment->worker_id,
                    $startsAt,
                    $appointment->total_duration,
                    $appointment,
                )) {
                    $validator->errors()->add(
                        'starts_at',
                        'El barbero ya tiene una cita en ese horario. Elige otra hora.'
                    );
                }
            },
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'starts_at.required' => 'Elige una nueva hora para la cita.',
            'starts_at.date_format' => 'La nueva hora no tiene un formato válido.',
        ];
    }
}
