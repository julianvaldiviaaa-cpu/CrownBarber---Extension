import { Link } from '@inertiajs/react';
import { BellRing, CalendarDays } from 'lucide-react';
import { route } from 'ziggy-js';
import AppointmentsSection from '@/Components/Appointments/AppointmentsSection';
import { useTranslation } from '@/lib/i18n';
import type { Appointment, Paginated } from '@/types';

type Props = {
    appointments: Paginated<Appointment>;
};

export default function WorkerDashboard({ appointments }: Props) {
    const { t } = useTranslation();

    const pendingCount = appointments.data.filter(
        (appointment) =>
            appointment.status === 'pending' ||
            appointment.status === 'proposed',
    ).length;

    return (
        <div className="mt-10 flex w-full flex-col gap-10">
            {pendingCount > 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                    <BellRing size={18} className="shrink-0 text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">
                        {t(
                            pendingCount === 1
                                ? '{count} solicitud de cita por atender. Confírmala, recházala o propón una nueva hora.'
                                : '{count} solicitudes de cita por atender. Confírmalas, recházalas o propón una nueva hora.',
                            { count: pendingCount },
                        )}
                    </p>
                </div>
            )}

            <div>
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-black">
                        <CalendarDays size={20} />
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
                        highlight="user"
                    />
                </div>
            </div>
        </div>
    );
}
