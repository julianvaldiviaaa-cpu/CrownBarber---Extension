import { Link, router, usePoll } from '@inertiajs/react';
import { CalendarPlus, ChevronLeft } from 'lucide-react';
import { route } from 'ziggy-js';
import AppointmentsSection from '@/Components/Appointments/AppointmentsSection';
import { Button } from '@/Components/Watermelon';
import AppLayout from '@/Layouts/AppLayout';
import { useTranslation } from '@/lib/i18n';
import { POLL_INTERVAL_MS } from '@/lib/utils';
import type { Appointment, Paginated } from '@/types';

type Props = {
    appointments: Paginated<Appointment>;
};

export default function AppointmentsIndex({ appointments }: Props) {
    const { t } = useTranslation();

    usePoll(POLL_INTERVAL_MS, { only: ['appointments'] });

    return (
        <AppLayout navbar="dashboard">
            <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <Button
                            onClick={() => router.get(route('dashboard'))}
                            className="mb-5 flex items-center justify-center gap-2 bg-black px-6 text-lg text-gray-300 transition-all duration-300 hover:gap-4"
                        >
                            <ChevronLeft /> {t('Dashboard')}{' '}
                        </Button>
                        <h1 className="text-5xl font-bold tracking-tight text-black md:text-6xl">
                            {t('Citas')}{' '}
                        </h1>
                        <p className="mt-2 text-sm font-medium tracking-tight text-black/40">
                            {appointments.total} {t('cita')}{' '}
                            {appointments.total === 1 ? '' : 's'}{' '}
                            {t('en total')}{' '}
                        </p>
                    </div>
                    <Link
                        href={route('appointments.create')}
                        className="flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-sm font-semibold tracking-tight text-white transition-transform duration-150 active:scale-[0.97]"
                    >
                        <CalendarPlus size={15} />
                        {t('Nueva cita')}{' '}
                    </Link>
                </div>

                <div className="mt-10">
                    <AppointmentsSection appointments={appointments} />
                </div>

                {/* Paginación */}
                {appointments.last_page > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                        {appointments.links.map((link, index) => {
                            if (!link.url) {
                                return (
                                    <span
                                        key={index}
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-sm text-black/30"
                                    >
                                        {link.label}
                                    </span>
                                );
                            }

                            const active = link.active;

                            return (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={
                                        active
                                            ? 'flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white'
                                            : 'flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-sm text-black/60 transition-colors hover:border-black hover:text-black'
                                    }
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
