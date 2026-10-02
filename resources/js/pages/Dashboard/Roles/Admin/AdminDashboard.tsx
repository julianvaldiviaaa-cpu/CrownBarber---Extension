import { Tooltip } from '@heroui/react';
import { Link, router } from '@inertiajs/react';
import {
    Briefcase,
    CalendarDays,
    Clock,
    MapPin,
    Scissors,
    Users,
} from 'lucide-react';
import { route } from 'ziggy-js';
import AppointmentsSection from '@/Components/Appointments/AppointmentsSection';
import { Button, Card } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import { branches } from '@/routes';
import type { AdminDashboardStats, Appointment, Paginated } from '@/types';

type Props = {
    stats: AdminDashboardStats;
    appointments: Paginated<Appointment>;
};

function pluralize(count: number, singular: string, plural: string) {
    return count === 1 ? singular : plural;
}

export default function AdminDashboard({ stats, appointments }: Props) {
    const { t } = useTranslation();

    return (
        <div className="mt-10 flex w-full flex-col gap-12">
            <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={<Scissors size={20} />}
                    count={stats.services}
                    label={pluralize(
                        stats.services,
                        t('Servicio'),
                        t('Servicios'),
                    )}
                    description={t(
                        'Servicios que actualmente puedes ofrecerle a tus clientes',
                    )}
                    createHref={route('services.create')}
                    createLabel={t('Nuevo servicio')}
                    manageHref={route('services')}
                />
                <StatCard
                    icon={<Users size={20} />}
                    count={stats.workers}
                    label={pluralize(
                        stats.workers,
                        t('Trabajador'),
                        t('Trabajadores'),
                    )}
                    description={t(
                        'Trabajadores activos que pueden brindar servicios',
                    )}
                    createHref={route('workers.create')}
                    createLabel={t('Nuevo trabajador')}
                    manageHref={route('workers')}
                />
                <Card className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow duration-300 hover:shadow-md">
                    <div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-black/70">
                            <Clock size={20} />
                        </div>
                        <p className="mt-5 text-xl font-semibold tracking-tight text-black">
                            {t('Horarios de apertura')}{' '}
                        </p>
                        <p className="mt-3 text-sm/5 tracking-tight text-black/45">
                            {t(
                                'Define los días y horas en que la barbería está abierta. Los clientes solo podrán agendar dentro de estos horarios.',
                            )}{' '}
                        </p>
                    </div>
                    <Link
                        href={route('business-hours')}
                        className="mt-8 flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold tracking-tight text-black/70 transition-colors duration-150 hover:border-black hover:text-black"
                    >
                        {t('Configurar')}{' '}
                    </Link>
                </Card>
                <Card className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div>
                        <MapPin size={20} />
                        <p className="mt-5 text-xl font-semibold">
                            {t('Sucursales')}
                        </p>
                        <p className="mt-3 text-sm text-black/45">
                            {t('Asigna barberos y servicios a cada sucursal.')}
                        </p>
                    </div>
                    <Link
                        href={branches()}
                        className="mt-8 flex justify-center rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold"
                    >
                        {t('Administrar')}
                    </Link>
                </Card>
            </div>

            <div>
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-black">
                        <CalendarDays size={20} />
                        {t('Mis citas como barbero')}{' '}
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

function StatCard({
    icon,
    count,
    label,
    description,
    createHref,
    createLabel,
    manageHref,
}: {
    icon: React.ReactNode;
    count: number;
    label: string;
    description: string;
    createHref: string;
    createLabel: string;
    manageHref: string;
}) {
    const { t } = useTranslation();

    return (
        <Card className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow duration-300 hover:shadow-md">
            <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-black/70">
                    {icon}
                </div>

                <p className="mt-5 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight text-black">
                        {count}
                    </span>
                    <span className="text-xl font-semibold tracking-tight text-black/50">
                        {label}
                    </span>
                </p>

                <p className="mt-3 text-sm/5 tracking-tight text-black/45">
                    {description}
                </p>
            </div>

            <div className="mt-8 flex items-center gap-2">
                <Tooltip delay={0}>
                    <Button
                        onPress={() => router.visit(createHref)}
                        aria-label={createLabel}
                        className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2.5 text-sm font-semibold tracking-tight text-white transition-transform duration-150 active:scale-[0.97]"
                    >
                        +
                    </Button>
                    <Tooltip.Content>{createLabel}</Tooltip.Content>
                </Tooltip>
                <Link
                    href={manageHref}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold tracking-tight text-black/70 transition-colors duration-150 hover:border-black hover:text-black"
                >
                    <Briefcase size={15} />
                    {t('Administrar')}{' '}
                </Link>
            </div>
        </Card>
    );
}
