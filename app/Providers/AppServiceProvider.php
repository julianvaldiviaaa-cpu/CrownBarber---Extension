<?php

namespace App\Providers;

use App\Models\BusinessHourOverride;
use App\Policies\BusinessHourPolicy;
use Carbon\CarbonImmutable;
use GuzzleHttp\Client;
use Illuminate\Foundation\Console\ServeCommand;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Minishlink\WebPush\WebPush;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(WebPush::class, fn () => new WebPush(
            ['VAPID' => [
                'subject' => config('services.webpush.subject'),
                'publicKey' => config('services.webpush.public_key'),
                'privateKey' => config('services.webpush.private_key'),
            ]],
            ['TTL' => 86400],
            new Client(['timeout' => 15, 'allow_redirects' => false]),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (PHP_OS_FAMILY === 'Windows' && $this->app->runningInConsole()) {
            ServeCommand::$passthroughVariables = array_values(array_unique([
                ...ServeCommand::$passthroughVariables,
                'TEMP',
                'TMP',
                'TMPDIR',
            ]));
        }

        if (config('services.webpush.openssl_config')) {
            putenv('OPENSSL_CONF='.config('services.webpush.openssl_config'));
        }

        $this->configureDefaults();

        // Las excepciones de horario se administran con la policy de BusinessHour.
        Gate::policy(BusinessHourOverride::class, BusinessHourPolicy::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
