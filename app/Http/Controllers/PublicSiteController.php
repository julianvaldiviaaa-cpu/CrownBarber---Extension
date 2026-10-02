<?php

namespace App\Http\Controllers;

use App\Models\BusinessHour;
use App\Models\Service;
use App\Models\User;
use App\UserRoles;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class PublicSiteController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('welcome', [
            'services' => $this->servicesQuery()->take(4)->get(),
            'barbers' => array_slice($this->barbersList(), 0, 4),
        ]);
    }

    public function services(): Response
    {
        return Inertia::render('Services', ['services' => $this->servicesQuery()->get()]);
    }

    public function barbers(): Response
    {
        return Inertia::render('Barbers', ['barbers' => $this->barbersList()]);
    }

    public function experience(): Response
    {
        return Inertia::render('Experience', [
            'hours' => BusinessHour::orderBy('day_of_week')
                ->get(['day_of_week', 'open_time', 'close_time', 'active']),
        ]);
    }

    /** @return Builder<Service> */
    private function servicesQuery(): Builder
    {
        return Service::query()->where('active', true)->whereHas('branches')
            ->with('branches:id,name')->orderBy('name')
            ->select(['id', 'name', 'description', 'price', 'duration', 'slug']);
    }

    /** @return list<array{id: int, name: string, specialty: ?string, description: ?string, profile_photo_url: string, cover_photo_url: string, gallery: array<int, array{id: string, url: string}>}> */
    private function barbersList(): array
    {
        return array_values(User::whereIn('role', [UserRoles::Worker, UserRoles::Admin])
            ->orderBy('name')->get()->map(fn (User $worker): array => $worker->publicWorkerProfile())->all());
    }
}
