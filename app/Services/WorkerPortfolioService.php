<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class WorkerPortfolioService
{
    /** @param array<string, mixed> $data */
    public function update(User $worker, array $data): void
    {
        $uploaded = [];
        $obsolete = [];

        try {
            foreach (['profile_photo', 'cover_photo'] as $field) {
                if (($data[$field] ?? null) instanceof UploadedFile) {
                    $uploaded[$field] = $this->store($data[$field], $worker);
                }
            }
            $gallery = [];
            foreach ($data['gallery_photos'] ?? [] as $photo) {
                $path = $this->store($photo, $worker);
                $uploaded[] = $path;
                $gallery[] = ['id' => (string) Str::uuid(), 'path' => $path];
            }

            DB::transaction(function () use ($worker, $data, $uploaded, $gallery, &$obsolete): void {
                $worker = User::query()->lockForUpdate()->findOrFail($worker->id);
                $changes = [
                    'specialty' => $data['specialty'] ?? null,
                    'description' => $data['description'] ?? null,
                ];
                foreach (['profile_photo', 'cover_photo'] as $field) {
                    if (isset($uploaded[$field]) || ($data['remove_'.$field] ?? false)) {
                        if ($worker->{$field.'_path'}) {
                            $obsolete[] = $worker->{$field.'_path'};
                        }
                        $changes[$field.'_path'] = $uploaded[$field] ?? null;
                    }
                }
                $retained = [];
                foreach ($worker->work_gallery ?? [] as $photo) {
                    if (in_array($photo['id'], $data['remove_gallery_ids'] ?? [], true)) {
                        $obsolete[] = $photo['path'];
                    } else {
                        $retained[] = $photo;
                    }
                }
                if (count($retained) + count($gallery) > 12) {
                    throw ValidationException::withMessages(['gallery_photos' => 'La galería admite hasta 12 fotos.']);
                }
                $changes['work_gallery'] = [...$retained, ...$gallery];
                $worker->forceFill($changes)->save();
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete(array_values($uploaded));
            throw $exception;
        }

        Storage::disk('public')->delete($obsolete);
    }

    private function store(UploadedFile $photo, User $worker): string
    {
        $path = $photo->store('workers/'.$worker->id, 'public');
        if ($path === false) {
            throw new RuntimeException('No se pudo guardar la imagen.');
        }

        return $path;
    }
}
