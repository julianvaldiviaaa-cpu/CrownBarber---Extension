<?php

namespace App\Http\Controllers;

use App\AppointmentStatus;
use App\Http\Requests\CompleteAppointmentRequest;
use App\Http\Requests\FilterAppointmentsRequest;
use App\Http\Requests\ProposeAppointmentRequest;
use App\Http\Requests\StoreAppointmentRequest;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\BusinessHour;
use App\Models\BusinessHourOverride;
use App\Models\Service;
use App\Models\User;
use App\Notifications\AppointmentCancelled;
use App\Notifications\AppointmentConfirmed;
use App\Notifications\AppointmentTimeProposed;
use App\Notifications\NewAppointmentRequest;
use App\Services\BusinessHoursService;
use App\Services\LoyaltyService;
use App\UserRoles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentsController extends Controller
{
    public function __construct(private LoyaltyService $loyalty) {}

    public function complete(CompleteAppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        $reward = $request->validated('loyalty_reward_service_id');
        $this->loyalty->complete($appointment, $request->user(), $reward === null ? null : (int) $reward);

        return back()->with('success', 'Visita completada. La tarjeta de fidelidad se actualizó correctamente.');
    }

    /**
     * Lista de citas según el rol: el cliente ve las suyas,
     * el barbero (worker/admin) las que le fueron asignadas.
     */
    public function index(FilterAppointmentsRequest $request): Response
    {
        $user = $request->user();
        $this->loyalty->synchronize($user);
        $filters = $request->filters();

        $appointments = Appointment::query()
            ->with(['user:id,name,phone', 'worker:id,name', 'services'])
            ->where(
                $user->role === UserRoles::User ? 'user_id' : 'worker_id',
                $user->id,
            )
            ->filtered($filters)
            ->orderBy('starts_at')
            ->orderBy('id')
            ->paginate(10)->withQueryString();

        return Inertia::render('Dashboard/Appointments/AppointmentsIndex', [
            'appointments' => $appointments,
            'filters' => $filters,
        ]);
    }

    /**
     * Formulario para agendar: servicios activos, barberos disponibles y horarios.
     */
    #[Authorize('create', Appointment::class)]
    public function create(Request $request): Response
    {
        $branches = Branch::orderBy('name')->get(['id', 'name', 'address']);
        $services = Service::where('active', true)->whereHas('branches')->with('branches:id')->orderBy('name')->get();
        $workers = $this->availableWorkers();
        $requestedService = $services->firstWhere('id', $request->integer('service'));
        $requestedWorker = $workers->firstWhere('id', $request->integer('barber'));
        $selectedBranchId = $branches->firstWhere('id', $request->integer('branch'))->id
            ?? $requestedWorker->branch_id
            ?? $requestedService?->branches->first()->id
            ?? $branches->first()->id;

        return Inertia::render('Dashboard/Appointments/AppointmentCreate', [
            'services' => $services,
            'branches' => $branches,
            'loyalty' => $this->loyalty->summary($request->user()),
            'workers' => $workers->map(fn (User $worker): array => [
                ...$worker->publicWorkerProfile(),
                'branch_id' => $worker->branch_id,
            ])->values()->all(),
            'selection' => [
                'service' => $requestedService?->branches->contains('id', $selectedBranchId) ? $requestedService->id : null,
                'barber' => $requestedWorker?->branch_id === $selectedBranchId ? $requestedWorker->id : null,
                'branch' => $selectedBranchId,
            ],
            'businessHours' => $this->businessHoursPayload(),
        ]);
    }

    /**
     * Slots de hora disponibles para un día, barbero y servicios.
     */
    public function availability(Request $request)
    {
        if (! $request->has('branch_id')) {
            $request->merge(['branch_id' => Branch::query()->value('id')]);
        }

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
            'worker_id' => ['sometimes', 'integer', Rule::exists('users', 'id')
                ->whereIn('role', [UserRoles::Worker->value, UserRoles::Admin->value])
                ->where('branch_id', $request->input('branch_id'))->withoutTrashed()],
            'services' => ['required', 'array', 'min:1'],
            'services.*' => ['integer', 'distinct', 'exists:services,id'],
        ]);

        $services = Service::whereIn('id', $data['services'])->where('active', true)
            ->whereHas('branches', fn ($query) => $query->whereKey($data['branch_id']))->get();

        if ($services->count() !== count($data['services'])) {
            return response()->json(['slots' => []]);
        }

        $duration = (int) $services->sum('duration');
        $date = Carbon::parse($data['date']);

        $service = app(BusinessHoursService::class);

        // Sin barbero: horas del negocio (unión). Con barbero: horas libres de ese barbero.
        $slots = isset($data['worker_id'])
            ? $service->availableSlotsForWorker((int) $data['worker_id'], $date, $duration)
            : $service->availableSlots($date, $duration);

        return response()->json(['slots' => $slots->values()]);
    }

    /**
     * Crea la cita con los servicios elegidos y avisa al barbero.
     */
    #[Authorize('create', Appointment::class)]
    public function store(StoreAppointmentRequest $request)
    {
        $services = Service::whereIn('id', $request->input('services'))->get();

        $startsAt = Carbon::parse($request->input('date').' '.$request->input('time'));

        $appointment = Appointment::create([
            'user_id' => $request->user()->id,
            'worker_id' => $request->input('worker_id'),
            'branch_id' => $request->input('branch_id'),
            'starts_at' => $startsAt,
            'status' => AppointmentStatus::Pending,
            'total_price' => $services->sum(fn (Service $service) => (float) $service->price),
            'total_duration' => (int) $services->sum('duration'),
        ]);

        foreach ($services as $service) {
            $appointment->services()->attach($service->id, [
                'price' => $service->price,
                'name' => $service->name,
            ]);
        }

        $appointment->load(['user', 'services']);

        $appointment->worker->notify(new NewAppointmentRequest($appointment, $request->user()));

        return redirect()
            ->route('appointments.show', $appointment)
            ->with('success', 'Cita agendada. El barbero revisará tu solicitud.');
    }

    /**
     * Detalle de una cita con su tabla de servicios.
     */
    #[Authorize('view', 'appointment')]
    public function show(Appointment $appointment)
    {
        $loyalty = $this->loyalty->summary($appointment->user);
        $appointment->refresh();
        $appointment->load([
            'user:id,name,phone,email',
            'worker:id,name,phone',
            'branch:id,name,address',
            'services',
            'proposer:id,name',
            'canceller:id,name',
        ]);

        return Inertia::render('Dashboard/Appointments/AppointmentShow', [
            'appointment' => $appointment,
            'loyalty' => $loyalty,
            'canComplete' => request()->user()->can('complete', $appointment),
            'businessHours' => $this->businessHoursPayload(),
        ]);
    }

    /**
     * El barbero confirma la cita pendiente / el usuario confirma la propuesta.
     */
    #[Authorize('confirm', 'appointment')]
    public function confirm(Appointment $appointment)
    {
        $wasProposed = $appointment->status === AppointmentStatus::Proposed;

        $appointment->update([
            'status' => AppointmentStatus::Confirmed,
            'starts_at' => $wasProposed ? $appointment->proposed_starts_at : $appointment->starts_at,
            'proposed_starts_at' => null,
            'proposed_by' => null,
        ]);

        $this->notifyOtherParty($appointment, new AppointmentConfirmed($appointment, request()->user()));

        return back()->with('success', 'Cita confirmada correctamente.');
    }

    /**
     * Cualquiera de las partes rechaza/cancela la cita.
     */
    #[Authorize('reject', 'appointment')]
    public function reject(Appointment $appointment)
    {
        $appointment->update([
            'status' => AppointmentStatus::Cancelled,
            'cancelled_by' => request()->user()->id,
            'proposed_starts_at' => null,
            'proposed_by' => null,
        ]);

        $this->notifyOtherParty($appointment, new AppointmentCancelled($appointment, request()->user()));

        return back()->with('success', 'La cita fue cancelada.');
    }

    /**
     * Propone una nueva hora; la otra parte la confirmará, rechazará o propondrá otra.
     */
    #[Authorize('propose', 'appointment')]
    public function propose(ProposeAppointmentRequest $request, Appointment $appointment)
    {
        $appointment->update([
            'status' => AppointmentStatus::Proposed,
            'proposed_starts_at' => Carbon::parse($request->input('starts_at')),
            'proposed_by' => $request->user()->id,
        ]);

        $this->notifyOtherParty($appointment, new AppointmentTimeProposed($appointment, $request->user()));

        return back()->with('success', 'Nueva hora propuesta. Esperando respuesta de la otra parte.');
    }

    /**
     * Cancela una cita ya confirmada (futura) por cualquiera de las partes.
     */
    #[Authorize('cancel', 'appointment')]
    public function cancel(Appointment $appointment)
    {
        $appointment->update([
            'status' => AppointmentStatus::Cancelled,
            'cancelled_by' => request()->user()->id,
            'proposed_starts_at' => null,
            'proposed_by' => null,
        ]);

        $this->notifyOtherParty($appointment, new AppointmentCancelled($appointment, request()->user()));

        return back()->with('success', 'La cita fue cancelada.');
    }

    protected function notifyOtherParty(Appointment $appointment, mixed $notification): void
    {
        $party = $appointment->worker_id === request()->user()->id
            ? $appointment->user
            : $appointment->worker;

        $party?->notify($notification);
    }

    /**
     * Barberos disponibles para reservar = usuarios con rol worker.
     *
     * @return Collection<int, User>
     */
    protected function availableWorkers(): Collection
    {
        return User::whereIn('role', [UserRoles::Worker->value, UserRoles::Admin->value])
            ->whereNotNull('branch_id')
            ->orderBy('name')
            ->get();
    }

    /**
     * Horarios (semanal + excepciones) para que el frontend calcule días/slots.
     *
     * @return array{weekly: \Illuminate\Database\Eloquent\Collection<int, BusinessHour>, overrides: \Illuminate\Database\Eloquent\Collection<int, BusinessHourOverride>}
     */
    protected function businessHoursPayload(): array
    {
        return [
            'weekly' => BusinessHour::orderBy('day_of_week')->get(),
            'overrides' => BusinessHourOverride::orderBy('date')->get(),
        ];
    }
}
