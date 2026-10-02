<?php

namespace App\Http\Controllers;

use App\Http\Requests\BusinessHourOverrideRequest;
use App\Http\Requests\BusinessHourRequest;
use App\Models\BusinessHour;
use App\Models\BusinessHourOverride;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Inertia\Inertia;

class BusinessHoursController extends Controller
{
    /**
     * Pantalla de administración de horarios (semanal + excepciones).
     */
    #[Authorize('viewAny', BusinessHour::class)]
    public function index()
    {
        return Inertia::render('Dashboard/Roles/Admin/BusinessHours/BusinessHours', [
            'weekly' => BusinessHour::orderBy('day_of_week')->get(),
            'overrides' => BusinessHourOverride::orderBy('date')->get(),
            'weekDays' => BusinessHour::weekDays(),
        ]);
    }

    /**
     * Crea o actualiza el horario de un día de la semana.
     */
    #[Authorize('create', BusinessHour::class)]
    public function store(BusinessHourRequest $request): JsonResponse|RedirectResponse
    {
        $hour = BusinessHour::updateOrCreate(
            ['day_of_week' => $request->input('day_of_week')],
            [
                'open_time' => $request->input('open_time'),
                'close_time' => $request->input('close_time'),
                'active' => $request->boolean('active', true),
            ],
        );

        if ($request->expectsJson()) {
            return response()->json($hour);
        }

        return back()->with('success', 'Horario guardado correctamente.');
    }

    /**
     * Actualiza un horario semanal existente.
     */
    #[Authorize('update', 'businessHour')]
    public function update(BusinessHourRequest $request, BusinessHour $businessHour): JsonResponse|RedirectResponse
    {
        $businessHour->update([
            'open_time' => $request->input('open_time'),
            'close_time' => $request->input('close_time'),
            'active' => $request->boolean('active', true),
        ]);

        if ($request->expectsJson()) {
            return response()->json($businessHour);
        }

        return back()->with('success', 'Horario actualizado correctamente.');
    }

    /**
     * Elimina el horario de un día (el día queda cerrado).
     */
    #[Authorize('delete', 'businessHour')]
    public function destroy(BusinessHour $businessHour)
    {
        $businessHour->delete();

        return back()->with('success', 'Horario eliminado. Ese día queda cerrado.');
    }

    /**
     * Crea una excepción por fecha (festivo, cierre, horario especial).
     */
    #[Authorize('createOverride', BusinessHourOverride::class)]
    public function storeOverride(BusinessHourOverrideRequest $request)
    {
        BusinessHourOverride::create($request->validated());

        return back()->with('success', 'Excepción de horario creada.');
    }

    /**
     * Actualiza una excepción.
     */
    #[Authorize('updateOverride', 'override')]
    public function updateOverride(BusinessHourOverrideRequest $request, BusinessHourOverride $override): JsonResponse|RedirectResponse
    {
        $override->update($request->validated());

        if ($request->expectsJson()) {
            return response()->json($override);
        }

        return back()->with('success', 'Excepción de horario actualizada.');
    }

    /**
     * Elimina una excepción.
     */
    #[Authorize('deleteOverride', 'override')]
    public function destroyOverride(BusinessHourOverride $override)
    {
        $override->delete();

        return back()->with('success', 'Excepción de horario eliminada.');
    }
}
