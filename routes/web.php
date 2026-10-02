<?php

use App\Http\Controllers\AppointmentsController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BusinessHoursController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\LogoutController;
use App\Http\Controllers\LoyaltyController;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicSiteController;
use App\Http\Controllers\PushSubscriptionsController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\WorkerPortfolioController;
use App\Http\Controllers\WorkersController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicSiteController::class, 'home'])->name('home');
Route::get('servicios', [PublicSiteController::class, 'services'])->name('public.services');
Route::get('barberos', [PublicSiteController::class, 'barbers'])->name('public.barbers');
Route::get('barberos/{worker}', [WorkerPortfolioController::class, 'show'])->name('public.worker');
Route::get('como-funciona', [PublicSiteController::class, 'experience'])->name('public.experience');

Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'index'])->name('login');
    Route::post('login', [LoginController::class, 'store'])->middleware('throttle:10,1')->name('login.store');
    Route::get('register', [RegisterController::class, 'index'])->name('register');
    Route::post('register', [RegisterController::class, 'store'])->middleware('throttle:10,1')->name('register.store');
});

Route::get('email/verify', [EmailController::class, 'notification'])
    ->middleware('auth')->name('verification.notice');

Route::get('email/verify/{id}/{hash}', [EmailController::class, 'verify'])
    ->middleware(['auth', 'signed'])->name('verification.verify');

Route::post('email/verify/send', [EmailController::class, 'send'])
    ->middleware(['auth', 'throttle:2,1'])->name('verification.send');

Route::post('logout', [LogoutController::class, 'store'])->middleware('auth')->name('logout');

Route::prefix('dashboard')->scopeBindings()->middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('loyalty', [LoyaltyController::class, 'index'])->name('loyalty');
    // Administradores
    Route::prefix('branches')->group(function () {
        Route::get('/', [BranchController::class, 'index'])->name('branches');
        Route::post('/', [BranchController::class, 'store'])->name('branches.store');
        Route::put('{branch}', [BranchController::class, 'update'])->name('branches.update');
        Route::delete('{branch}', [BranchController::class, 'destroy'])->name('branches.destroy');
        Route::put('{branch}/services', [BranchController::class, 'syncServices'])->name('branches.services');
        Route::patch('workers/{worker}', [BranchController::class, 'assignWorker'])->name('branches.workers');
    });
    Route::prefix('workers')->group(function () {
        Route::get('/', [WorkersController::class, 'index'])->name('workers');
        Route::get('create', [WorkersController::class, 'create'])->name('workers.create');
        Route::post('/', [WorkersController::class, 'store'])->name('workers.store');
        Route::prefix('{worker}')->group(function () {
            Route::put('portfolio', [WorkerPortfolioController::class, 'update'])->name('workers.portfolio');
            // Desde Show se puede actualizar un trabajdor
            Route::get('/', [WorkersController::class, 'show'])->name('workers.show');
            Route::put('/', [WorkersController::class, 'update'])->name('workers.update');
            Route::patch('/role', [WorkersController::class, 'updateRole'])->name('workers.role');
            Route::delete('/', [WorkersController::class, 'destroy'])->name('workers.destroy');
        });
    });
    Route::prefix('services')->group(function () {
        Route::get('/', [ServiceController::class, 'index'])->name('services');
        Route::get('create', [ServiceController::class, 'create'])->name('services.create');
        Route::post('/', [ServiceController::class, 'store'])->name('services.store');
        Route::prefix('{service}')->group(function () {
            Route::get('/', [ServiceController::class, 'show'])->name('services.show');
            Route::get('edit', [ServiceController::class, 'show'])->name('services.edit');
            Route::put('/', [ServiceController::class, 'update'])->name('services.update');
            Route::patch('active', [ServiceController::class, 'updateActive'])->name('services.active');
            Route::delete('/', [ServiceController::class, 'destroy'])->name('services.destroy');
        });
    });

    // Citas
    Route::prefix('appointments')->group(function () {
        Route::get('/', [AppointmentsController::class, 'index'])->name('appointments');
        Route::get('create', [AppointmentsController::class, 'create'])->name('appointments.create');
        Route::get('availability', [AppointmentsController::class, 'availability'])->name('appointments.availability');
        Route::post('/', [AppointmentsController::class, 'store'])->name('appointments.store');
        Route::prefix('{appointment}')->group(function () {
            Route::get('/', [AppointmentsController::class, 'show'])->name('appointments.show');
            Route::post('complete', [AppointmentsController::class, 'complete'])->name('appointments.complete');
            Route::post('confirm', [AppointmentsController::class, 'confirm'])->name('appointments.confirm');
            Route::post('reject', [AppointmentsController::class, 'reject'])->name('appointments.reject');
            Route::post('propose', [AppointmentsController::class, 'propose'])->name('appointments.propose');
            Route::post('cancel', [AppointmentsController::class, 'cancel'])->name('appointments.cancel');
        });
    });

    // Horarios de apertura (admin)
    Route::prefix('business-hours')->group(function () {
        Route::get('/', [BusinessHoursController::class, 'index'])->name('business-hours');
        Route::post('/', [BusinessHoursController::class, 'store'])->name('business-hours.store');
        Route::prefix('{businessHour}')->group(function () {
            Route::put('/', [BusinessHoursController::class, 'update'])->name('business-hours.update');
            Route::delete('/', [BusinessHoursController::class, 'destroy'])->name('business-hours.destroy');
        });

        // Excepciones por fecha
        Route::post('overrides', [BusinessHoursController::class, 'storeOverride'])->name('business-hours.overrides.store');
        Route::prefix('overrides/{override}')->group(function () {
            Route::put('/', [BusinessHoursController::class, 'updateOverride'])->name('business-hours.overrides.update');
            Route::delete('/', [BusinessHoursController::class, 'destroyOverride'])->name('business-hours.overrides.destroy');
        });
    });

    // Notificaciones (app)
    Route::prefix('notifications')->group(function () {
        Route::get('latest', [NotificationsController::class, 'latest'])->name('notifications.latest');
        Route::post('read', [NotificationsController::class, 'markAllRead'])->name('notifications.read');
        Route::post('push', [PushSubscriptionsController::class, 'store'])->middleware('throttle:20,1')->name('notifications.push.store');
        Route::delete('push', [PushSubscriptionsController::class, 'destroy'])->name('notifications.push.destroy');
    });

    // Mi cuenta (perfil)
    Route::prefix('profile')->group(function () {
        Route::put('portfolio', [WorkerPortfolioController::class, 'updateOwn'])->name('profile.portfolio');
        Route::get('/', [ProfileController::class, 'index'])->name('profile');
        Route::put('/', [ProfileController::class, 'update'])->name('profile.update');
        Route::put('password', [ProfileController::class, 'password'])->name('profile.password');
        Route::put('notifications', [ProfileController::class, 'notifications'])->name('profile.notifications');
    });
});
