import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarPlus, Scissors } from 'lucide-react';
import { route } from 'ziggy-js';
import AppointmentsSection from '@/Components/Appointments/AppointmentsSection';
import { useTranslation } from '@/lib/i18n';
import type { Appointment, Paginated } from '@/types';

type Props = {
    appointments: Paginated<Appointment>;
};

export default function UserDashboard({ appointments }: Props) {
    const { t } = useTranslation();

    return (
        <div className="mt-10 flex w-full flex-col gap-10">
            {/* Banner de agendar */}
            <div className="flex flex-col items-center gap-4 rounded-3xl bg-black px-8 py-10 text-center md:flex-row md:justify-between md:text-left">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <Scissors size={22} />
                    </div>
                    <div>
                        <p className="text-xl font-bold tracking-tight text-white">
                            {t('¿Listo para un corte?')}{' '}
                        </p>
                        <p className="text-sm text-white/60">
                            {t(
                                'Elige tus servicios, la hora y tu barbero favorito.',
                            )}{' '}
                        </p>
                    </div>
                </div>
                <Link
                    href={route('appointments.create')}
                    className="group flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold tracking-tight text-black transition-transform duration-150 active:scale-[0.97]"
                >
                    <CalendarPlus size={17} />
                    {t('Agendar cita')}{' '}
                    <ArrowRight
                        size={15}
                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                </Link>
            </div>

            <div>
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight text-black">
                        {t('Mis citas')}{' '}
                    </h2>
                    <Link
                        href={route('appointments')}
                        className="text-sm font-semibold tracking-tight text-black/50 transition-colors hover:text-black"
                    >
                        {t('Ver todas →')}{' '}
                    </Link>
                </div>
                <div className="mt-5">
                    <AppointmentsSection
                        appointments={appointments}
                        highlight="worker"
                    />
                </div>
            </div>
        </div>
    );
}
