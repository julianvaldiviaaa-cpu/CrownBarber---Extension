import { CalendarX2, History } from 'lucide-react';
import AppointmentActions from '@/Components/Appointments/AppointmentActions';
import AppointmentCard from '@/Components/Appointments/AppointmentCard';
import AppointmentFilters from '@/Components/Appointments/AppointmentFilters';
import { Card } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import type { Appointment, Paginated } from '@/types';

type Props = {
    appointments: Paginated<Appointment>;
    highlight?: 'worker' | 'user';
    showActions?: boolean;
};

export default function AppointmentsSection({
    appointments,
    highlight = 'worker',
    showActions = true,
}: Props) {
    const { t } = useTranslation();

    const now = new Date();
    const upcoming = appointments.data.filter(
        (appointment) => new Date(appointment.starts_at) >= now,
    );
    const past = appointments.data.filter(
        (appointment) => new Date(appointment.starts_at) < now,
    );

    if (appointments.data.length === 0) {
        return (
            <>
                <AppointmentFilters />
                <Card className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-black/30">
                        <CalendarX2 size={22} />
                    </div>
                    <p className="text-sm font-medium text-black/45">
                        {t('No hay citas para los filtros seleccionados.')}{' '}
                    </p>
                </Card>
            </>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <AppointmentFilters />
            <section>
                <div className="flex items-center gap-2">
                    <h2 className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                        {t('Próximas citas')}{' '}
                    </h2>
                    <span className="text-xs font-medium text-black/30">
                        ({upcoming.length})
                    </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {upcoming.map((appointment) => (
                        <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            highlight={highlight}
                            actions={
                                showActions ? (
                                    <AppointmentActions
                                        appointment={appointment}
                                        compact
                                    />
                                ) : undefined
                            }
                        />
                    ))}
                    {upcoming.length === 0 && (
                        <p className="text-sm text-black/40">
                            {t('Sin citas próximas.')}{' '}
                        </p>
                    )}
                </div>
            </section>

            <section>
                <div className="flex items-center gap-2">
                    <History size={14} className="text-black/40" />
                    <h2 className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                        {t('Citas anteriores')}{' '}
                    </h2>
                    <span className="text-xs font-medium text-black/30">
                        ({past.length})
                    </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {past.map((appointment) => (
                        <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            highlight={highlight}
                        />
                    ))}
                    {past.length === 0 && (
                        <p className="text-sm text-black/40">
                            {t('Sin citas anteriores.')}{' '}
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
