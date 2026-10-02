import { Link, usePage, usePoll } from '@inertiajs/react';
import LoyaltyCard from '@/Components/LoyaltyCard';
import AppLayout from '@/Layouts/AppLayout';
import { useTranslation } from '@/lib/i18n';
import { POLL_INTERVAL_MS } from '@/lib/utils';
import type {
    AdminDashboardStats,
    Appointment,
    Paginated,
    Loyalty,
} from '@/types';
import AdminDashboard from './Roles/Admin/AdminDashboard';
import UserDashboard from './Roles/User/UserDashboard';
import WorkerDashboard from './Roles/Worker/WorkerDashboard';

type Props = {
    stats: AdminDashboardStats | null;
    appointments: Paginated<Appointment>;
    loyalty: Loyalty | null;
};

export default function Dashboard({ stats, appointments, loyalty }: Props) {
    const { t } = useTranslation();

    usePoll(POLL_INTERVAL_MS, { only: ['appointments', 'stats', 'loyalty'] });

    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <AppLayout navbar="dashboard">
            <div className="mx-auto max-w-6xl">
                <h1 className="text-3xl tracking-tight sm:text-5xl md:text-8xl md:tracking-[-.55rem]">
                    {t('Hola,')}{' '}
                    <span className="font-medium">{user?.name}</span>
                </h1>

                {user?.role === 'admin' && (
                    <AdminDashboard
                        stats={stats!}
                        appointments={appointments}
                    />
                )}
                {user?.role === 'worker' && (
                    <WorkerDashboard appointments={appointments} />
                )}
                {user?.role === 'user' && (
                    <>
                        {loyalty && (
                            <div className="mt-8">
                                <LoyaltyCard loyalty={loyalty} />
                            </div>
                        )}
                        <UserDashboard appointments={appointments} />
                    </>
                )}
                {appointments.last_page > 1 && (
                    <nav
                        aria-label={t('Páginas de citas')}
                        className="mt-8 flex items-center justify-center gap-5 text-sm"
                    >
                        {appointments.prev_page_url && (
                            <Link
                                href={appointments.prev_page_url}
                                className="rounded-full border border-gray-300 px-4 py-2"
                            >
                                {t('Anterior')}{' '}
                            </Link>
                        )}
                        <span>
                            {t('Página')} {appointments.current_page} {t('de')}{' '}
                            {appointments.last_page}
                        </span>
                        {appointments.next_page_url && (
                            <Link
                                href={appointments.next_page_url}
                                className="rounded-full border border-gray-300 px-4 py-2"
                            >
                                {t('Siguiente')}{' '}
                            </Link>
                        )}
                    </nav>
                )}
            </div>
        </AppLayout>
    );
}
