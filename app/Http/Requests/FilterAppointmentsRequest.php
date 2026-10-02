<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterAppointmentsRequest extends FormRequest
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
            'period' => ['nullable', 'in:today,week,month'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', Rule::when($this->filled('date_from'), ['after_or_equal:date_from'])],
            'time_from' => ['nullable', 'date_format:H:i'],
            'time_to' => ['nullable', 'date_format:H:i', Rule::when($this->filled('time_from'), ['after_or_equal:time_from'])],
        ];
    }

    /** @return array<string, string|null> */
    public function filters(): array
    {
        $filters = $this->validated();
        $today = now();
        $range = match ($filters['period'] ?? null) {
            'today' => [$today, $today],
            'week' => [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()],
            'month' => [$today->copy()->startOfMonth(), $today->copy()->endOfMonth()],
            default => null,
        };

        if ($range !== null) {
            $filters['date_from'] = $range[0]->toDateString();
            $filters['date_to'] = $range[1]->toDateString();
        }

        return $filters;
    }
}
