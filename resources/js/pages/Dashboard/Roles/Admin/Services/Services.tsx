import { Link, router } from '@inertiajs/react';
import { ArrowUpRight, ChevronLeft, Clock, Plus, Scissors } from 'lucide-react';
import { route } from 'ziggy-js';
import { Button, Card } from '@/Components/Watermelon';
import AppLayout from '@/Layouts/AppLayout';
import { useTranslation } from '@/lib/i18n';
import type { Paginated, Service } from '@/types';

type Props = {
    services: Paginated<Service>;
};

export default function Services({ services }: Props) {
    const { t } = useTranslation();

    return (
        <AppLayout navbar="dashboard">
            <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <Button
                            onClick={() => router.get(route('dashboard'))}
                            className="mb-10 flex items-center justify-center gap-2 bg-black text-gray-300 transition-all duration-300 hover:gap-4"
                        >
                            <ChevronLeft /> {t('Dashboard')}{' '}
                        </Button>
                        <h1 className="text-4xl font-bold tracking-tight text-black md:text-5xl">
                            {t('Servicios')}{' '}
                        </h1>
                        <p className="mt-2 text-sm font-medium tracking-tight text-black/40">
                            {services.total}{' '}
                            {services.total === 1
                                ? t('servicio registrado')
                                : t('servicios registrados')}
                        </p>
                    </div>

                    <Link
                        href={route('services.create')}
                        className="group flex shrink-0 items-center gap-1.5 rounded-full bg-black px-5 py-3 text-sm font-semibold tracking-tight text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97]"
                    >
                        <Plus size={16} />
                        {t('Nuevo servicio')}{' '}
                    </Link>
                </div>

                {/* Grid moderno — tarjetas con elevación y borde que reacciona al hover */}
                {services.data.length > 0 ? (
                    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {services.data.map((service) => (
                            <Link
                                key={service.id}
                                href={route('services.show', service)}
                                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-black hover:shadow-xl"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-black/70 transition-colors duration-300 group-hover:bg-black group-hover:text-white">
                                            <Scissors size={18} />
                                        </div>
                                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold tracking-tight text-black/60">
                                            <Clock size={11} />
                                            {service.duration} {t('min')}{' '}
                                        </span>
                                    </div>

                                    <h2 className="mt-5 text-xl font-bold tracking-tight text-black">
                                        {service.name}
                                    </h2>

                                    <p className="mt-1 flex items-baseline gap-1">
                                        <span className="text-3xl font-extrabold tracking-tight text-black">
                                            ${service.price}
                                        </span>
                                        <span className="text-xs font-medium text-black/35">
                                            MXN
                                        </span>
                                    </p>
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                                    <span className="text-sm font-semibold tracking-tight text-black/50 transition-colors duration-200 group-hover:text-black">
                                        {t('Administrar')}{' '}
                                    </span>
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-all duration-300 group-hover:bg-black group-hover:text-white">
                                        <ArrowUpRight
                                            size={15}
                                            className="transition-transform duration-300 group-hover:rotate-45"
                                        />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card className="mt-10 flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                            <Scissors className="text-black/30" size={22} />
                        </div>
                        <div>
                            <p className="font-bold tracking-tight text-black">
                                {t('Aún no tienes servicios')}{' '}
                            </p>
                            <p className="mt-1 text-sm text-black/45">
                                {t(
                                    'Crea el primero para empezar a ofrecerlo a tus clientes',
                                )}{' '}
                            </p>
                        </div>
                        <Link
                            href={route('services.create')}
                            className="mt-2 flex items-center gap-1.5 rounded-full bg-black px-5 py-3 text-sm font-semibold tracking-tight text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97]"
                        >
                            <Plus size={16} />
                            {t('Nuevo servicio')}{' '}
                        </Link>
                    </Card>
                )}

                {/* Paginación */}
                {services.data.length > 0 && services.last_page > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-1.5">
                        {services.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                preserveScroll
                                className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold tracking-tight transition-all duration-200 ${
                                    link.active
                                        ? 'bg-black text-white shadow-sm'
                                        : link.url
                                          ? 'text-black/45 hover:bg-gray-100 hover:text-black'
                                          : 'pointer-events-none text-black/15'
                                }`}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
