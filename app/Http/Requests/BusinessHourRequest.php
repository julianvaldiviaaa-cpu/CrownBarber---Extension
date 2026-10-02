<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BusinessHourRequest extends FormRequest
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
        $ignoreId = $this->route('businessHour')?->id;

        return [
            'day_of_week' => [
                'required',
                'integer',
                'between:0,6',
                Rule::when($ignoreId !== null, Rule::unique('business_hours', 'day_of_week')->ignore($ignoreId)),
            ],

            'open_time' => [
                'required',
                'date_format:H:i',
            ],

            'close_time' => [
                'required',
                'date_format:H:i',
                'after:open_time',
            ],

            'active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function prepareForValidation(): void
    {
        $this->merge([
            'active' => filter_var($this->input('active', true), FILTER_VALIDATE_BOOLEAN),
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
            'day_of_week.required' => 'Elige un día de la semana.',
            'day_of_week.between' => 'El día de la semana no es válido.',
            'day_of_week.unique' => 'Ese día de la semana ya tiene horario configurado.',

            'open_time.required' => 'La hora de apertura es obligatoria.',
            'open_time.date_format' => 'La hora de apertura no es válida.',

            'close_time.required' => 'La hora de cierre es obligatoria.',
            'close_time.date_format' => 'La hora de cierre no es válida.',
            'close_time.after' => 'La hora de cierre debe ser posterior a la de apertura.',
        ];
    }
}
