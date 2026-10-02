import { Link, router } from '@inertiajs/react';
import { ArrowUpRight, Clock, Hash, Scissors, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { route } from 'ziggy-js';
import StatusBadge from '@/Components/Appointments/StatusBadge';
import { Card } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import {
    cn,
    formatDate,
    formatMoney,
    formatTime,
    parseServerDate,
} from '@/lib/utils';
import type { Appointment } from '@/types';

type Props = {
    appointment: Appointment;
    /** A quién resaltamos: el barbero (vista cliente) o el cliente (vista barbero). */
    highlight?: 'worker' | 'user';
    actions?: ReactNode;
    /** Oculta el clic a la página de detalle (p.ej. si hay botones internos). */
    clickable?: boolean;
};

export default function AppointmentCard({
    appointment,
    highlight = 'worker',
    actions,
    clickable = true,
}: Props) {
    const { t, intlLocale } = useTranslation();

    const startsAt = parseServerDate(appointment.starts_at);
    const proposed = appointment.proposed_starts_at
        ? parseServerDate(appointment.proposed_starts_at)
        : null;
    const party =
        highlight === 'worker' ? appointment.worker : appointment.user;

    const body = (
        <>
            <div
                className="cursor-pointer"
                onClick={() =>
                    router.get(route('appointments.show', appointment.id))
                }
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold tracking-tight text-black">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-black/70">
                            <Hash size={15} />
                        </span>
                        {t('Cita #')}
                        {appointment.id}
                    </div>
                    <StatusBadge status={appointment.status} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-black/60">
                    <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-black/40" />
                        {formatDate(startsAt, intlLocale)} ·{' '}
                        {formatTime(startsAt)}
                        {proposed && appointment.status === 'proposed' && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                {t('Propuesta:')}{' '}
                                {formatDate(proposed, intlLocale)}{' '}
                                {formatTime(proposed)}
                            </span>
                        )}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <UserRound size={14} className="text-black/40" />
                        {highlight === 'worker'
                            ? t('Barbero')
                            : t('Cliente')}:{' '}
                        <strong className="font-semibold text-black">
                            {party?.name ?? '—'}
                        </strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Scissors size={14} className="text-black/40" />
                        {appointment.services?.length ?? 0}{' '}
                        {t(
                            (appointment.services?.length ?? 0) === 1
                                ? 'servicio'
                                : 'servicios',
                        )}{' '}
                        · {appointment.total_duration} {t('min')}{' '}
                    </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                        <p className="text-xs font-medium text-black/35">
                            {t('Precio total')}{' '}
                        </p>
                        <p className="text-xl font-extrabold tracking-tight text-black">
                            {formatMoney(appointment.total_price, intlLocale)}
                        </p>
                    </div>
                    {actions}
                    {!actions && clickable && (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-black/60 transition-colors duration-200 group-hover:bg-black group-hover:text-white">
                            <ArrowUpRight size={15} />
                        </span>
                    )}
                </div>
            </div>
        </>
    );

    if (!clickable || actions) {
        return (
            <Card className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                {body}
            </Card>
        );
    }

    return (
        <Link
            href={route('appointments.show', appointment)}
            className={cn(
                'group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-black hover:shadow-lg',
            )}
        >
            {body}
        </Link>
    );
}
