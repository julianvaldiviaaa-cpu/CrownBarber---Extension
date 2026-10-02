import { Head, Link, usePoll } from '@inertiajs/react';
import { CalendarPlus, Gift } from 'lucide-react';
import LoyaltyCard from '@/Components/LoyaltyCard';
import { Badge, Card, Table } from '@/Components/Watermelon';
import AppLayout from '@/Layouts/AppLayout';
import { useTranslation } from '@/lib/i18n';
import { formatDate, formatMoney, POLL_INTERVAL_MS } from '@/lib/utils';
import { create } from '@/routes/appointments';
import type { Appointment, Loyalty, Paginated } from '@/types';

type Visit = Pick<
    Appointment,
    'id' | 'loyalty_visit_date' | 'loyalty_reward_name' | 'loyalty_discount'
>;

export default function LoyaltyPage({
    loyalty,
    history,
}: {
    loyalty: Loyalty;
    history: Paginated<Visit>;
}) {
    const { t, intlLocale } = useTranslation();

    usePoll(POLL_INTERVAL_MS, { only: ['loyalty', 'history'] });

    return (
        <AppLayout navbar="dashboard">
            <Head title={t('Mi fidelidad')} />
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium tracking-widest text-black/40 uppercase">
                            {t('Crown Club')}{' '}
                        </p>
                        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                            {t('Mi fidelidad')}{' '}
                        </h1>
                    </div>
                    <Link
                        href={create()}
                        className="wm-button inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
                    >
                        <CalendarPlus size={16} />
                        {t('Agendar visita')}{' '}
                    </Link>
                </header>
                <LoyaltyCard loyalty={loyalty} showLink={false} />
                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        [t('Días de visita'), loyalty.visits],
                        [t('Premios disponibles'), loyalty.rewards_available],
                        [t('Premios disfrutados'), loyalty.rewards_redeemed],
                    ].map(([label, value]) => (
                        <Card key={label} className="gap-2">
                            <p className="text-sm text-black/50">{label}</p>
                            <p className="text-3xl font-semibold tabular-nums">
                                {value}
                            </p>
                        </Card>
                    ))}
                </div>
                <Card>
                    <h2 className="text-xl font-semibold tracking-tight">
                        {t('Tus visitas y recompensas')}{' '}
                    </h2>
                    {history.data.length ? (
                        <Table>
                            <thead>
                                <tr className="border-b border-gray-100 text-left text-xs text-black/40">
                                    <th className="py-3">
                                        {t('Día de visita')}
                                    </th>
                                    <th className="px-3 py-3">
                                        {t('Registro')}
                                    </th>
                                    <th className="py-3 text-right">
                                        {t('Beneficio')}{' '}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.data.map((visit) => (
                                    <tr
                                        key={visit.id}
                                        className="border-b border-gray-100 last:border-0"
                                    >
                                        <td className="py-4 whitespace-nowrap">
                                            {formatDate(
                                                `${visit.loyalty_visit_date}T12:00:00`,
                                                intlLocale,
                                            )}
                                        </td>
                                        <td className="px-3 py-4">
                                            {visit.loyalty_reward_name ??
                                                t('Visita pagada')}
                                        </td>
                                        <td className="py-4 text-right">
                                            {visit.loyalty_reward_name ? (
                                                <Badge className="border-green-200 bg-green-50 text-green-800">
                                                    <Gift size={12} />
                                                    {formatMoney(
                                                        visit.loyalty_discount,
                                                        intlLocale,
                                                    )}
                                                </Badge>
                                            ) : (
                                                <span className="text-black/50">
                                                    {t('Sello registrado')}{' '}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <p className="py-6 text-sm leading-6 text-black/50">
                            {t(
                                'Aquí aparecerá tu primer sello cuando el barbero complete tu visita. Las reservas pendientes o canceladas no suman sellos.',
                            )}{' '}
                        </p>
                    )}
                    {history.last_page > 1 && (
                        <nav
                            aria-label={t('Páginas de visitas')}
                            className="flex items-center justify-between gap-3 text-sm"
                        >
                            {history.prev_page_url ? (
                                <Link href={history.prev_page_url}>
                                    {t('Anterior')}{' '}
                                </Link>
                            ) : (
                                <span />
                            )}
                            <span>
                                {history.current_page} / {history.last_page}
                            </span>
                            {history.next_page_url && (
                                <Link href={history.next_page_url}>
                                    {t('Siguiente')}{' '}
                                </Link>
                            )}
                        </nav>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
