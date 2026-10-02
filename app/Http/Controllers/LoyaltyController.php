<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Services\LoyaltyService;
use App\UserRoles;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoyaltyController extends Controller
{
    public function __construct(private LoyaltyService $loyalty) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()->role === UserRoles::User, 403);

        return Inertia::render('Dashboard/Loyalty', [
            'loyalty' => $this->loyalty->summary($request->user()),
            'history' => Appointment::withTrashed()->whereBelongsTo($request->user())
                ->whereNotNull('loyalty_visit_date')->orderByDesc('loyalty_visit_date')
                ->paginate(10, ['id', 'loyalty_visit_date', 'loyalty_reward_name', 'loyalty_discount'])->withQueryString(),
        ]);
    }
}
