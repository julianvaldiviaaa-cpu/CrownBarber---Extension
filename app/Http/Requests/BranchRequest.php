<?php

namespace App\Http\Requests;

use App\UserRoles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

class BranchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === UserRoles::Admin;
    }

    /** @return array{name: array{string, string, string, Unique}, address: array{string, string, string}} */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('branches')->ignore($this->route('branch'))],
            'address' => ['nullable', 'string', 'max:255'],
        ];
    }
}
