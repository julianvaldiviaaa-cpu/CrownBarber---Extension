<?php

namespace App\Http\Controllers;

use App\Http\Requests\ServiceRequest;
use App\Http\Requests\UpdateActiveServiceRequest;
use App\Models\Branch;
use App\Models\Service;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Inertia\Inertia;

class ServiceController extends Controller
{
    #[Authorize('viewAny', Service::class)]
    public function index()
    {
        $services = Service::latest()->paginate(10);

        return Inertia::render(
            'Dashboard/Roles/Admin/Services/Services',
            [
                'services' => $services,
            ]
        );
    }

    #[Authorize('create', Service::class)]
    public function create()
    {
        return Inertia::render('Dashboard/Roles/Admin/Services/ServiceCreate', [
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
        ]);
    }

    #[Authorize('create', Service::class)]
    public function store(ServiceRequest $request)
    {
        $service = Service::create(
            $request->safe()->except('branches')
        );

        $service->branches()->sync($request->validated('branches', [Branch::query()->orderBy('id')->value('id')]));

        return redirect()
            ->route('services.show', $service)
            ->with(
                'success',
                'Servicio creado correctamente.'
            );
    }

    #[Authorize('view', 'service')]
    public function show(Service $service)
    {
        return Inertia::render(
            'Dashboard/Roles/Admin/Services/ServiceShow',
            [
                'service' => $service,
                'branches' => Branch::orderBy('name')->get(['id', 'name']),
                'branchIds' => $service->branches()->pluck('branches.id'),
            ]
        );
    }

    #[Authorize('update', 'service')]
    public function update(
        ServiceRequest $request,
        Service $service
    ) {
        $service->update(
            $request->safe()->except('branches')
        );

        if ($request->has('branches')) {
            $service->branches()->sync($request->validated('branches'));
        }

        return redirect()->route('services.show', $service)->with(
            'success',
            'Servicio actualizado correctamente.'
        );
    }

    #[Authorize('update', 'service')]
    public function updateActive(
        UpdateActiveServiceRequest $request,
        Service $service
    ) {
        $service->update(
            $request->validated()
        );

        return back()->with(
            'success',
            'Estado del servicio actualizado correctamente.'
        );
    }

    #[Authorize('delete', 'service')]
    public function destroy(Service $service)
    {
        $service->delete();

        return redirect()
            ->route('services')
            ->with(
                'success',
                'Servicio eliminado correctamente.'
            );
    }
}
