<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateActiveServiceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'active.required' => 'El estado del servicio es obligatorio',
            'active.boolean' => 'Estado del servicio no valido',
        ];
    }
}
