<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CompleteAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('complete', $this->route('appointment'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'loyalty_reward_service_id' => ['nullable', 'integer', 'exists:services,id'],
        ];
    }

    public function messages(): array
    {
        return ['loyalty_reward_service_id.exists' => 'Selecciona un servicio válido para el premio.'];
    }
}
