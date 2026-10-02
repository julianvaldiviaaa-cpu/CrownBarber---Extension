<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normaliza datos antes de validar.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->email)),
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20', "regex:/^\+?[0-9]{10,15}$/", 'unique:users,phone'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8)->letters()->numbers()->symbols()->uncompromised(),
                function ($attribute, $value, $fail) {
                    $name = strtolower((string) $this->name);
                    $emailLocalPart = strtolower(explode('@', (string) $this->email)[0]);
                    $value = strtolower($value);

                    if ($name !== '' && str_contains($value, $name)) {
                        $fail('La contraseña no debe contener tu nombre.');

                        return;
                    }

                    if ($emailLocalPart !== '' && str_contains($value, $emailLocalPart)) {
                        $fail('La contraseña no debe contener tu correo electrónico.');
                    }
                },
            ],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'name.string' => 'El nombre debe ser texto válido.',
            'name.max' => 'El nombre no puede exceder los 255 caracteres.',

            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'email.max' => 'El correo electrónico no puede exceder los 255 caracteres.',
            'email.unique' => 'Este correo electrónico ya está registrado.',

            'phone.required' => 'El teléfono es obligatorio.',
            'phone.string' => 'El teléfono debe ser texto válido.',
            'phone.max' => 'El teléfono no puede exceder los 20 caracteres.',
            'phone.regex' => 'Ingresa un número de teléfono válido (10 a 15 dígitos, opcionalmente con +).',
            'phone.unique' => 'Este número de teléfono ya está registrado.',

            'password.required' => 'La contraseña es obligatoria.',
            'password.string' => 'La contraseña debe ser texto válido.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.letters' => 'La contraseña debe incluir al menos una letra.',
            'password.numbers' => 'La contraseña debe incluir al menos un número.',
            'password.symbols' => 'La contraseña debe incluir al menos un símbolo.',
            'password.uncompromised' => 'Esta contraseña ha aparecido en filtraciones de datos. Por favor elige otra.',
        ];
    }
}
