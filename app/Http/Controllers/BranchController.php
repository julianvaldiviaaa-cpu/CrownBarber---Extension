<?php

namespace App\Http\Controllers;

use App\Http\Requests\BranchRequest;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Service;
use App\Models\User;
use App\UserRoles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeAdmin($request);

        return Inertia::render('Dashboard/Roles/Admin/Branches', [
            'branches' => Branch::with('services:id')->orderBy('name')->get(),
            'workers' => User::whereIn('role', [UserRoles::Worker->value, UserRoles::Admin->value])->orderBy('name')->get(['id', 'name', 'branch_id']),
            'services' => Service::orderBy('name')->get(['id', 'name', 'active']),
        ]);
    }

    public function store(BranchRequest $request): RedirectResponse
    {
        Branch::create($request->validated());

        return back()->with('success', 'Sucursal creada correctamente.');
    }

    public function update(BranchRequest $request, Branch $branch): RedirectResponse
    {
        $branch->update($request->validated());

        return back()->with('success', 'Sucursal actualizada correctamente.');
    }

    public function destroy(Request $request, Branch $branch): RedirectResponse
    {
        $this->authorizeAdmin($request);

        if ($branch->workers()->exists() || $branch->appointments()->withTrashed()->exists()) {
            return back()->with('error', 'No se puede eliminar una sucursal con barberos o citas asignadas.');
        }

        if (Branch::count() === 1) {
            return back()->with('error', 'Debe existir al menos una sucursal.');
        }

        $branch->delete();

        return back()->with('success', 'Sucursal eliminada correctamente.');
    }

    public function assignWorker(Request $request, User $worker): RedirectResponse
    {
        $this->authorizeAdmin($request);
        abort_unless(in_array($worker->role, [UserRoles::Worker, UserRoles::Admin], true), 404);

        $data = $request->validate([
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
        ]);

        if ($worker->branch_id !== (int) $data['branch_id'] && Appointment::query()
            ->where('worker_id', $worker->id)
            ->activeBooking()
            ->where(fn ($query) => $query->where('starts_at', '>=', now())
                ->orWhere('proposed_starts_at', '>=', now()))
            ->exists()) {
            return back()->with('error', 'Cancela o concluye las citas futuras del barbero antes de cambiarlo de sucursal.');
        }

        $worker->update($data);

        return back()->with('success', 'Sucursal del barbero actualizada.');
    }

    public function syncServices(Request $request, Branch $branch): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'services' => ['present', 'array'],
            'services.*' => ['integer', 'distinct', Rule::exists('services', 'id')->withoutTrashed()],
        ]);

        $branch->services()->sync($data['services']);

        return back()->with('success', 'Servicios de la sucursal actualizados.');
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === UserRoles::Admin, 403);
    }
}
