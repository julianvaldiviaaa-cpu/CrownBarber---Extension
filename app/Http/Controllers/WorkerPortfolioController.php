<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateWorkerPortfolioRequest;
use App\Models\User;
use App\Services\WorkerPortfolioService;
use App\UserRoles;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WorkerPortfolioController extends Controller
{
    public function __construct(private WorkerPortfolioService $portfolios) {}

    public function show(User $worker): Response
    {
        abort_unless(in_array($worker->role, [UserRoles::Worker, UserRoles::Admin], true), 404);

        return Inertia::render('WorkerPortfolio', ['worker' => $worker->publicWorkerProfile()]);
    }

    public function update(UpdateWorkerPortfolioRequest $request, User $worker): RedirectResponse
    {
        $this->portfolios->update($request->worker(), $request->validated());

        return back()->with('success', 'Perfil profesional actualizado. Tus fotos ya se pueden ver al reservar.');
    }

    public function updateOwn(UpdateWorkerPortfolioRequest $request): RedirectResponse
    {
        return $this->update($request, $request->worker());
    }
}
