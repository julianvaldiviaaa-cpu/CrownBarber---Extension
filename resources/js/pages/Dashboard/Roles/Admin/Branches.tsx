import { Link, router, useForm } from '@inertiajs/react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useTranslation } from '@/lib/i18n';
import { dashboard } from '@/routes';
import {
    destroy,
    services as saveServices,
    store,
    update,
    workers as assignWorker,
} from '@/routes/branches';

type Branch = {
    id: number;
    name: string;
    address: string | null;
    services: { id: number }[];
};

type Props = {
    branches: Branch[];
    workers: { id: number; name: string; branch_id: number | null }[];
    services: { id: number; name: string; active: boolean }[];
};

function BranchCard({
    branch,
    services,
}: {
    branch: Branch;
    services: Props['services'];
}) {
    const { t } = useTranslation();
    const { data, setData, put, errors, processing } = useForm({
        name: branch.name,
        address: branch.address ?? '',
    });
    const [selectedServices, setSelectedServices] = useState(
        branch.services.map((service) => service.id),
    );

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                    <label className="block text-sm font-semibold text-black/70">
                        {t('Nombre de la sucursal')}
                        <input
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-black"
                        />
                        {errors.name && (
                            <span className="text-red-600">{errors.name}</span>
                        )}
                    </label>
                    <label className="block text-sm font-semibold text-black/70">
                        {t('Dirección')}
                        <input
                            value={data.address}
                            onChange={(event) =>
                                setData('address', event.target.value)
                            }
                            className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-black"
                        />
                        {errors.address && (
                            <span className="text-red-600">
                                {errors.address}
                            </span>
                        )}
                    </label>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm(t('¿Eliminar esta sucursal?'))) {
                            router.delete(destroy.url(branch.id));
                        }
                    }}
                    className="rounded-lg border border-red-200 p-3 text-red-700"
                    aria-label={t('Eliminar sucursal')}
                >
                    <Trash2 size={18} />
                </button>
            </div>
            <button
                type="button"
                onClick={() =>
                    put(update.url(branch.id), { preserveScroll: true })
                }
                disabled={processing}
                className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
            >
                {t('Guardar datos')}
            </button>

            <div className="mt-8 border-t border-gray-100 pt-6">
                <h2 className="font-semibold">{t('Servicios disponibles')}</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {services.map((service) => (
                        <label
                            key={service.id}
                            className="flex min-h-11 items-center gap-3 rounded-lg border border-gray-200 px-3 text-sm"
                        >
                            <input
                                type="checkbox"
                                checked={selectedServices.includes(service.id)}
                                onChange={() =>
                                    setSelectedServices((current) =>
                                        current.includes(service.id)
                                            ? current.filter(
                                                  (id) => id !== service.id,
                                              )
                                            : [...current, service.id],
                                    )
                                }
                            />
                            <span>{service.name}</span>
                            {!service.active && (
                                <span className="text-black/40">
                                    ({t('Inactivo')})
                                </span>
                            )}
                        </label>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() =>
                        router.put(
                            saveServices.url(branch.id),
                            { services: selectedServices },
                            { preserveScroll: true },
                        )
                    }
                    className="mt-4 rounded-full border border-black px-5 py-2.5 text-sm font-semibold"
                >
                    {t('Guardar servicios')}
                </button>
            </div>
        </section>
    );
}

export default function Branches({ branches, workers, services }: Props) {
    const { t } = useTranslation();
    const { data, setData, post, errors, processing, reset } = useForm({
        name: '',
        address: '',
    });

    return (
        <AppLayout navbar="dashboard">
            <main className="mx-auto max-w-6xl px-6 py-12">
                <Link
                    href={dashboard()}
                    className="text-sm font-semibold text-black/50"
                >
                    ← {t('Dashboard')}
                </Link>
                <div className="mt-5 flex items-center gap-3">
                    <MapPin />
                    <h1 className="text-4xl font-bold">{t('Sucursales')}</h1>
                </div>
                <p className="mt-2 text-black/60">
                    {t(
                        'Administra las sucursales, los barberos asignados y los servicios que ofrece cada una.',
                    )}
                </p>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        post(store.url(), { onSuccess: () => reset() });
                    }}
                    className="mt-8 grid gap-3 rounded-2xl bg-black p-6 text-white sm:grid-cols-[1fr_1fr_auto]"
                >
                    <label className="text-sm">
                        {t('Nueva sucursal')}
                        <input
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            required
                            className="mt-1 min-h-11 w-full rounded-lg bg-white px-3 text-black"
                        />
                        {errors.name && (
                            <span className="text-red-300">{errors.name}</span>
                        )}
                    </label>
                    <label className="text-sm">
                        {t('Dirección')}
                        <input
                            value={data.address}
                            onChange={(event) =>
                                setData('address', event.target.value)
                            }
                            className="mt-1 min-h-11 w-full rounded-lg bg-white px-3 text-black"
                        />
                        {errors.address && (
                            <span className="text-red-300">
                                {errors.address}
                            </span>
                        )}
                    </label>
                    <button
                        disabled={processing}
                        className="flex min-h-11 items-center justify-center gap-2 self-end rounded-lg bg-white px-5 font-semibold text-black"
                    >
                        <Plus size={18} />
                        {t('Crear')}
                    </button>
                </form>

                <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
                    <h2 className="text-xl font-bold">
                        {t('Barberos por sucursal')}
                    </h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {workers.map((worker) => (
                            <label
                                key={worker.id}
                                className="flex flex-col gap-2 text-sm font-semibold"
                            >
                                {worker.name}
                                <select
                                    value={worker.branch_id ?? ''}
                                    onChange={(event) =>
                                        router.patch(
                                            assignWorker.url(worker.id),
                                            {
                                                branch_id: Number(
                                                    event.target.value,
                                                ),
                                            },
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 font-normal"
                                >
                                    <option value="" disabled>
                                        {t('Elige una sucursal')}
                                    </option>
                                    {branches.map((branch) => (
                                        <option
                                            key={branch.id}
                                            value={branch.id}
                                        >
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>
                </section>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    {branches.map((branch) => (
                        <BranchCard
                            key={branch.id}
                            branch={branch}
                            services={services}
                        />
                    ))}
                </div>
            </main>
        </AppLayout>
    );
}
