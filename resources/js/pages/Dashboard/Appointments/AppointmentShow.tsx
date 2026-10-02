import { Link, usePoll } from '@inertiajs/react';
import { ArrowLeft, Clock, Phone, Scissors, UserRound } from 'lucide-react';
import { route } from 'ziggy-js';
import AppointmentActions from '@/Components/Appointments/AppointmentActions';
import CompleteAppointment from '@/Components/Appointments/CompleteAppointment';
import StatusBadge from '@/Components/Appointments/StatusBadge';
import LoyaltyCard from '@/Components/LoyaltyCard';
import { Table, Card } from '@/Components/Watermelon';
import AppLayout from '@/Layouts/AppLayout';
import { useTranslation } from '@/lib/i18n';
import {
    POLL_INTERVAL_MS,
    formatDate,
    formatMoney,
    formatTime,
} from '@/lib/utils';
import type { Appointment, Loyalty } from '@/types';

type Props = {
    appointment: Appointment;
    loyalty: Loyalty;
    canComplete: boolean;
};

export default function AppointmentShow({
    appointment,
    loyalty,
    canComplete,
}: Props) {
    const { t, intlLocale } = useTranslation();

    usePoll(POLL_INTERVAL_MS, {
        only: ['appointment', 'loyalty', 'canComplete'],
    });

    const services = appointment.services ?? [];
    const totalDuration = appointment.total_duration;

    const canAct =
        appointment.status === 'pending' ||
        appointment.status === 'proposed' ||
        (appointment.status === 'confirmed' &&
            new Date(appointment.starts_at) > new Date());

    return (
        <AppLayout navbar="dashboard">
            <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
                <Link
                    href={route('appointments')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.15em] text-black/40 uppercase transition-colors duration-150 hover:text-black"
                >
                    <ArrowLeft size={12} />
                    {t('Citas')}{' '}
                </Link>

                <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-black md:text-5xl">
                            {t('Cita #')}
                            {appointment.id}
                        </h1>
                        <p className="mt-2 flex items-center gap-2 text-lg font-semibold tracking-tight text-black/70">
                            <StatusBadge status={appointment.status} />
                        </p>
                    </div>

                    {canAct && <AppointmentActions appointment={appointment} />}
                </div>

                <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
                    {/* Detalles principales */}
                    <div className="flex flex-col gap-8 md:col-span-2">
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                                {t('Detalles')}{' '}
                            </h3>

                            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                {appointment.branch && (
                                    <div>
                                        <dt className="text-xs font-medium text-black/40">
                                            {t('Sucursal')}
                                        </dt>
                                        <dd className="mt-1 font-bold">
                                            {appointment.branch.name}
                                        </dd>
                                        {appointment.branch.address && (
                                            <dd className="text-sm text-black/50">
                                                {appointment.branch.address}
                                            </dd>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <dt className="flex items-center gap-1.5 text-xs font-medium text-black/40">
                                        <Clock size={13} />
                                        {t('Fecha y hora')}{' '}
                                    </dt>
                                    <dd className="mt-1 text-lg font-bold tracking-tight text-black">
                                        {formatDate(
                                            appointment.starts_at,
                                            intlLocale,
                                        )}{' '}
                                        · {formatTime(appointment.starts_at)}
                                    </dd>
                                    <dd className="text-sm text-black/45">
                                        {totalDuration}{' '}
                                        {t('min de servicio')}{' '}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="flex items-center gap-1.5 text-xs font-medium text-black/40">
                                        <UserRound size={13} />
                                        {t('Barbero')}{' '}
                                    </dt>
                                    <dd className="mt-1 text-lg font-bold tracking-tight text-black">
                                        {appointment.worker?.name}
                                    </dd>
                                    <dd className="flex items-center gap-1 text-sm text-black/45">
                                        <Phone size={12} />
                                        {appointment.worker?.phone}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="flex items-center gap-1.5 text-xs font-medium text-black/40">
                                        <UserRound size={13} />
                                        {t('Cliente')}{' '}
                                    </dt>
                                    <dd className="mt-1 text-lg font-bold tracking-tight text-black">
                                        {appointment.user?.name}
                                    </dd>
                                    <dd className="flex items-center gap-1 text-sm text-black/45">
                                        <Phone size={12} />
                                        {appointment.user?.phone}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-xs font-medium text-black/40">
                                        {t('Estado')}{' '}
                                    </dt>
                                    <dd className="mt-1 text-lg font-bold tracking-tight text-black">
                                        {appointment.status === 'pending' &&
                                            t('Pendiente de confirmación')}
                                        {appointment.status === 'proposed' &&
                                            t('Nueva hora propuesta')}
                                        {appointment.status === 'confirmed' &&
                                            t('Confirmada')}
                                        {appointment.status === 'cancelled' &&
                                            t('Cancelada')}
                                        {appointment.status === 'completed' &&
                                            t('Completada')}
                                    </dd>
                                </div>
                            </dl>

                            {appointment.proposed_starts_at &&
                                appointment.proposer && (
                                    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                                        <p>
                                            <strong>
                                                {appointment.proposer.name}
                                            </strong>{' '}
                                            {t('propuso la hora')}{' '}
                                            <strong>
                                                {formatDate(
                                                    appointment.proposed_starts_at,
                                                    intlLocale,
                                                )}{' '}
                                                ·{' '}
                                                {formatTime(
                                                    appointment.proposed_starts_at,
                                                )}
                                            </strong>
                                            .{' '}
                                            {appointment.proposed_by !== null &&
                                                t(
                                                    'La otra parte puede confirmarla, rechazarla o proponer otra.',
                                                )}
                                        </p>
                                    </div>
                                )}

                            {appointment.status === 'cancelled' &&
                                appointment.canceller && (
                                    <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
                                        <p>
                                            {t('Cita cancelada por')}{' '}
                                            <strong>
                                                {appointment.canceller.name}
                                            </strong>
                                            .
                                        </p>
                                    </div>
                                )}
                        </section>

                        {/* Tabla de servicios */}
                        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <h3 className="flex items-center gap-1.5 px-6 pt-6 text-xs font-semibold tracking-widest text-black/40 uppercase">
                                <Scissors size={13} />
                                {t('Servicios (')}
                                {services.length})
                            </h3>

                            <div className="mt-4 overflow-x-auto">
                                <Table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-xs font-semibold tracking-widest text-black/35 uppercase">
                                            <th className="px-6 py-3">
                                                {t('Servicio')}{' '}
                                            </th>
                                            <th className="px-6 py-3 text-right">
                                                {t('Precio al momento')}{' '}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {services.map((service) => (
                                            <tr
                                                key={service.pivot.service_id}
                                                className="border-b border-gray-50 last:border-0"
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="font-bold tracking-tight text-black">
                                                        {service.pivot.name}
                                                    </p>
                                                    <p className="text-sm text-black/45">
                                                        {service.duration}{' '}
                                                        {t('min')}{' '}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right font-extrabold tracking-tight text-black">
                                                    {formatMoney(
                                                        service.pivot.price,
                                                        intlLocale,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                                <span className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                                    {t('Total')}{' '}
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="text-sm text-black/45">
                                        {totalDuration} {t('min')}{' '}
                                    </span>
                                    <span className="text-2xl font-extrabold tracking-tight text-black">
                                        {formatMoney(
                                            appointment.total_price,
                                            intlLocale,
                                        )}
                                    </span>
                                </span>
                            </div>
                        </section>
                    </div>

                    {/* Resumen lateral */}
                    <aside className="flex flex-col gap-6">
                        {canComplete && (
                            <CompleteAppointment
                                appointment={appointment}
                                loyalty={loyalty}
                            />
                        )}
                        {appointment.loyalty_reward_name && (
                            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-900">
                                <p className="font-semibold">
                                    {t('Premio de fidelidad canjeado')}{' '}
                                </p>
                                <p className="mt-2">
                                    {appointment.loyalty_reward_name}
                                    {t(': gratis.')}{' '}
                                </p>
                                <p className="mt-1">
                                    {t('Descuento aplicado:')}{' '}
                                    {formatMoney(
                                        appointment.loyalty_discount,
                                        intlLocale,
                                    )}
                                </p>
                            </div>
                        )}
                        <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                                {t('Resumen')}{' '}
                            </h3>
                            <ul className="mt-4 flex flex-col gap-3 text-sm text-black/60">
                                <li className="flex items-center justify-between">
                                    <span>{t('Duración total')}</span>
                                    <strong className="text-black">
                                        {totalDuration} {t('min')}{' '}
                                    </strong>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span>{t('Total a pagar')}</span>
                                    <strong className="text-black">
                                        {formatMoney(
                                            appointment.total_price,
                                            intlLocale,
                                        )}
                                    </strong>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span>{t('Creada')}</span>
                                    <span className="text-black/45">
                                        {formatDate(
                                            appointment.created_at,
                                            intlLocale,
                                        )}
                                    </span>
                                </li>
                            </ul>
                        </Card>
                    </aside>
                </div>
                <div className="mt-8">
                    <LoyaltyCard
                        loyalty={loyalty}
                        showLink={false}
                        customerName={appointment.user?.name}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
