<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BusinessHourOverrideRequest extends FormRequest
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
        $ignoreId = $this->route('override')?->id;

        return [
            'date' => [
                'required',
                'date_format:Y-m-d',
                Rule::unique('business_hour_overrides', 'date')->ignore($ignoreId),
            ],

            'is_closed' => [
                'sometimes',
                'boolean',
            ],

            'open_time' => [
                'nullable',
                Rule::requiredIf(! $this->boolean('is_closed')),
                'date_format:H:i',
            ],

            'close_time' => [
                'nullable',
                Rule::requiredIf(! $this->boolean('is_closed')),
                'date_format:H:i',
                'after:open_time',
            ],
        ];
    }

    /**
     * Configura valores por defecto.
     */
    public function prepareForValidation(): void
    {
        $isClosed = filter_var($this->input('is_closed', false), FILTER_VALIDATE_BOOLEAN);

        $this->merge([
            'is_closed' => $isClosed,
            'open_time' => $isClosed ? null : $this->input('open_time'),
            'close_time' => $isClosed ? null : $this->input('close_time'),
        ]);
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'date.required' => 'Elige una fecha.',
            'date.unique' => 'Ya existe una excepción para esa fecha.',

            'open_time.date_format' => 'La hora de apertura no es válida.',
            'close_time.date_format' => 'La hora de cierre no es válida.',
            'close_time.after' => 'La hora de cierre debe ser posterior a la de apertura.',
            'open_time.required' => 'Si no es un día cerrado, define la hora de apertura.',
            'close_time.required' => 'Si no es un día cerrado, define la hora de cierre.',
        ];
    }
}
