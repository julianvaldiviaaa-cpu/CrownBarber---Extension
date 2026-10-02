<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branches' => ['sometimes', 'array', 'min:1'],
            'branches.*' => ['integer', 'distinct', 'exists:branches,id'],
            'loyalty_reward_type' => ['nullable', 'string', 'in:haircut,facial'],
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],

            'price' => [
                'required',
                'numeric',
                'min:0',
            ],

            'duration' => [
                'required',
                'integer',
                'min:1',
                'max:1440',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del servicio es obligatorio.',
            'name.string' => 'El nombre del servicio no es válido.',
            'name.max' => 'El nombre del servicio puede tener máximo :max caracteres.',

            'description.string' => 'La descripción del servicio no es válida.',
            'description.max' => 'La descripción del servicio puede tener máximo :max caracteres.',

            'price.required' => 'El precio del servicio es obligatorio.',
            'price.numeric' => 'El precio del servicio no es válido.',
            'price.min' => 'El precio del servicio no puede ser negativo.',

            'duration.required' => 'La duración del servicio es obligatoria.',
            'duration.integer' => 'La duración debe expresarse en minutos.',
            'duration.min' => 'La duración debe ser de al menos 1 minuto.',
            'duration.max' => 'La duración no puede superar las 24 horas.',
        ];
    }
}
