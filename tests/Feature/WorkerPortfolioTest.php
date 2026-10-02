<?php

use App\Models\User;
use App\UserRoles;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
    $this->worker = User::factory()->create(['role' => UserRoles::Worker]);
    $this->admin = User::factory()->create(['role' => UserRoles::Admin]);
});

it('permite al trabajador subir su foto de perfil desde un formulario multipart', function (string $extension) {
    $this->actingAs($this->worker)->post(route('profile.portfolio'), [
        '_method' => 'put',
        'profile_photo' => UploadedFile::fake()->image('perfil.'.$extension),
    ])->assertRedirect()->assertSessionHasNoErrors();

    $worker = $this->worker->fresh();
    expect($worker->profile_photo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($worker->profile_photo_path);
})->with(['jpg', 'png', 'webp']);

it('permite publicar perfil portada especialidad descripción y trabajos', function () {
    $this->actingAs($this->admin)->post(route('workers.portfolio', $this->worker), [
        '_method' => 'put',
        'specialty' => 'Degradados y barba',
        'description' => 'Trabajo con cuidado cada detalle.',
        'profile_photo' => UploadedFile::fake()->image('perfil.jpg'),
        'cover_photo' => UploadedFile::fake()->image('portada.png'),
        'gallery_photos' => [UploadedFile::fake()->image('corte.webp'), UploadedFile::fake()->image('barba.jpg')],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $worker = $this->worker->fresh();
    expect($worker->specialty)->toBe('Degradados y barba')
        ->and($worker->description)->toBe('Trabajo con cuidado cada detalle.')
        ->and($worker->work_gallery)->toHaveCount(2);
    Storage::disk('public')->assertExists([$worker->profile_photo_path, $worker->cover_photo_path, ...array_column($worker->work_gallery, 'path')]);
    $this->get(route('public.worker', $worker))->assertInertia(fn (Assert $page) => $page
        ->component('WorkerPortfolio')->where('worker.specialty', 'Degradados y barba')->has('worker.gallery', 2)
        ->missing('worker.email')->missing('worker.phone')->missing('worker.password')->missing('worker.work_gallery')
        ->where('worker.profile_photo_url', Storage::disk('public')->url($worker->profile_photo_path)));
});

it('un trabajador puede editar su perfil y un admin también el suyo', function (UserRoles $role) {
    $worker = $role === UserRoles::Admin ? $this->admin : $this->worker;
    $this->actingAs($worker)->put(route('profile.portfolio'), ['specialty' => 'Cortes clásicos', 'description' => 'Mi estilo.'])
        ->assertRedirect()->assertSessionHasNoErrors();
    expect($worker->fresh()->specialty)->toBe('Cortes clásicos');
    $this->get(route('profile'))->assertInertia(fn (Assert $page) => $page->where('portfolio.id', $worker->id));
})->with([UserRoles::Worker, UserRoles::Admin]);

it('protege la edición de perfiles ajenos y de clientes', function () {
    $other = User::factory()->create(['role' => UserRoles::Worker]);
    $client = User::factory()->create(['role' => UserRoles::User]);
    $this->actingAs($other)->put(route('workers.portfolio', $this->worker), ['specialty' => 'Otro'])->assertForbidden();
    $this->actingAs($client)->put(route('profile.portfolio'), ['specialty' => 'Otro'])->assertForbidden();
    $this->actingAs($this->admin)->put(route('workers.portfolio', $client), ['specialty' => 'Otro'])->assertForbidden();
    expect($this->worker->fresh()->specialty)->toBeNull();
});

it('reemplaza y elimina solo las fotos del perfil autorizado', function () {
    $this->actingAs($this->worker)->put(route('profile.portfolio'), [
        'profile_photo' => UploadedFile::fake()->image('perfil.jpg'),
        'cover_photo' => UploadedFile::fake()->image('cover.jpg'),
        'gallery_photos' => [UploadedFile::fake()->image('uno.jpg'), UploadedFile::fake()->image('dos.jpg')],
    ])->assertSessionHasNoErrors();
    $previous = $this->worker->fresh();
    $removed = $previous->work_gallery[0];
    $retained = $previous->work_gallery[1];
    $this->put(route('profile.portfolio'), [
        'profile_photo' => UploadedFile::fake()->image('nuevo.jpg'),
        'remove_cover_photo' => true,
        'remove_gallery_ids' => [$removed['id']],
    ])->assertSessionHasNoErrors();
    $current = $this->worker->fresh();
    expect($current->work_gallery)->toBe([$retained])->and($current->cover_photo_path)->toBeNull();
    Storage::disk('public')->assertMissing([$previous->profile_photo_path, $previous->cover_photo_path, $removed['path']]);
    Storage::disk('public')->assertExists([$current->profile_photo_path, $retained['path']]);
    $this->put(route('profile.portfolio'), ['remove_gallery_ids' => ['foreign-photo']])->assertSessionHasErrors('remove_gallery_ids.0');
    expect($this->worker->fresh()->work_gallery)->toBe([$retained]);
});

it('rechaza archivos no válidos y fotos demasiado grandes', function () {
    $this->actingAs($this->worker)->put(route('profile.portfolio'), [
        'profile_photo' => UploadedFile::fake()->create('script.svg', 10, 'image/svg+xml'),
        'cover_photo' => UploadedFile::fake()->image('large.jpg')->size(2049),
        'gallery_photos' => [UploadedFile::fake()->create('archivo.pdf', 10, 'application/pdf')],
    ])->assertSessionHasErrors(['profile_photo', 'cover_photo', 'gallery_photos.0']);
    Storage::disk('public')->assertDirectoryEmpty('workers');
    expect($this->worker->fresh()->profile_photo_path)->toBeNull();
});

it('limita la galería incluyendo las fotos ya publicadas', function () {
    $gallery = array_map(fn (int $id) => ['id' => (string) $id, 'path' => 'workers/old-'.$id.'.jpg'], range(1, 12));
    $this->worker->forceFill(['work_gallery' => $gallery])->save();
    $this->actingAs($this->worker)->put(route('profile.portfolio'), ['gallery_photos' => [UploadedFile::fake()->image('otra.jpg')]])
        ->assertSessionHasErrors('gallery_photos');
    expect($this->worker->fresh()->work_gallery)->toHaveCount(12);
    $this->put(route('profile.portfolio'), ['remove_gallery_ids' => ['1'], 'gallery_photos' => [UploadedFile::fake()->image('otra.jpg')]])
        ->assertSessionHasNoErrors();
    expect($this->worker->fresh()->work_gallery)->toHaveCount(12);
});

it('incluye los perfiles de todos los trabajadores y administradores en la reserva', function () {
    $client = User::factory()->create(['role' => UserRoles::User]);
    $this->actingAs($client)->get(route('appointments.create'))->assertInertia(fn (Assert $page) => $page
        ->has('workers', 2)->where('workers.0.profile_photo_url', '/worker-avatar.svg')
        ->where('workers.0.cover_photo_url', '/worker-cover.svg')->has('workers.0.gallery', 0)
        ->missing('workers.0.email')->missing('workers.0.phone')->missing('workers.0.password'));
    $this->actingAs($this->admin)->get(route('workers.show', $this->worker))->assertInertia(fn (Assert $page) => $page->where('portfolio.id', $this->worker->id));
});

it('no publica cuentas cliente ni perfiles eliminados', function () {
    $client = User::factory()->create(['role' => UserRoles::User]);
    $this->get(route('public.worker', $client))->assertNotFound();
    $this->worker->delete();
    $this->get(route('public.worker', $this->worker->id))->assertNotFound();
    $this->get(route('public.worker', $this->admin))->assertSuccessful();
});
