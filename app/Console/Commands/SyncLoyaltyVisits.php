<?php

namespace App\Console\Commands;

use App\Services\LoyaltyService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('loyalty:sync-visits')]
#[Description('Registra las visitas confirmadas que ya terminaron y aplica sus premios de fidelidad.')]
class SyncLoyaltyVisits extends Command
{
    public function handle(LoyaltyService $loyalty): int
    {
        $count = $loyalty->synchronize();
        $this->info("Visitas registradas: {$count}");

        return self::SUCCESS;
    }
}
