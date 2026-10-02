<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePushSubscriptionRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'endpoint' => ['bail', 'required', 'string', 'url:https', 'max:2048', function (string $attribute, mixed $value, \Closure $fail): void {
                $host = parse_url($value, PHP_URL_HOST);
                $allowed = $host === 'fcm.googleapis.com'
                    || $host === 'updates.push.services.mozilla.com'
                    || $host === 'web.push.apple.com'
                    || (is_string($host) && str_ends_with($host, '.notify.windows.com'));

                if (! $allowed || parse_url($value, PHP_URL_USER) || parse_url($value, PHP_URL_PASS)
                    || (parse_url($value, PHP_URL_PORT) !== null && parse_url($value, PHP_URL_PORT) !== 443)) {
                    $fail('El proveedor de notificaciones no es válido.');
                }
            }],
            'keys' => ['required', 'array:p256dh,auth'],
            'keys.p256dh' => ['required', 'string', 'size:87', 'regex:/^[A-Za-z0-9_-]+$/'],
            'keys.auth' => ['required', 'string', 'size:22', 'regex:/^[A-Za-z0-9_-]+$/'],
        ];
    }
}
