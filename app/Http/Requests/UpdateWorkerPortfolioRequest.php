<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateWorkerPortfolioRequest extends FormRequest
{
    private ?User $portfolioWorker = null;

    public function worker(): User
    {
        if ($this->portfolioWorker !== null) {
            return $this->portfolioWorker;
        }
        $worker = $this->route('worker');

        return $this->portfolioWorker = $worker instanceof User
            ? $worker : User::query()->findOrFail($this->user()->id);
    }

    public function authorize(): bool
    {
        return $this->user()->can('updatePortfolio', $this->worker());
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        $image = ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:max_width=6000,max_height=6000'];

        return [
            'specialty' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:3000'],
            'profile_photo' => $image,
            'cover_photo' => $image,
            'remove_profile_photo' => ['sometimes', 'boolean'],
            'remove_cover_photo' => ['sometimes', 'boolean'],
            'gallery_photos' => ['sometimes', 'array', 'max:12'],
            'gallery_photos.*' => [...$image, 'required'],
            'remove_gallery_ids' => ['sometimes', 'array', 'max:12'],
            'remove_gallery_ids.*' => ['string', 'distinct', Rule::in(array_column($this->worker()->work_gallery ?? [], 'id'))],
        ];
    }

    /** @return array<callable> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $retained = count($this->worker()->work_gallery ?? []) - count($this->input('remove_gallery_ids', []));
            if ($retained + count($this->file('gallery_photos', [])) > 12) {
                $validator->errors()->add('gallery_photos', 'La galería admite hasta 12 fotos. Quita alguna antes de añadir más.');
            }
        }];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'profile_photo.max' => 'La foto de perfil debe pesar como máximo 2 MB.',
            'cover_photo.max' => 'La portada debe pesar como máximo 2 MB.',
            'gallery_photos.*.max' => 'Cada foto debe pesar como máximo 2 MB.',
            'profile_photo.image' => 'Selecciona una imagen válida.',
            'cover_photo.image' => 'Selecciona una imagen válida.',
            'gallery_photos.*.image' => 'Selecciona una imagen válida.',
            'remove_gallery_ids.*.in' => 'Esa foto no pertenece a este trabajador.',
        ];
    }
}
