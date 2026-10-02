<?php

namespace App\Http\Requests;

use App\UserRoles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateRoleWorkerRequest extends FormRequest
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
            'role' => ['required', 'string', new Enum(UserRoles::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'role.required' => 'El rol es requerido',
            'role.string' => 'Rol no valido',
        ];
    }
}
