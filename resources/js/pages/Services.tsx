import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { PageIntro, ServiceList } from '@/Components/PublicSections';
import type { PublicService } from '@/Components/PublicSections';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTranslation } from '@/lib/i18n';

export default function Services({ services }: { services: PublicService[] }) {
    const { t } = useTranslation();

    const [search, setSearch] = useState('');
    const filtered = services.filter((service) =>
        `${service.name} ${service.description ?? ''}`
            .toLocaleLowerCase('es')
            .includes(search.toLocaleLowerCase('es').trim()),
    );

    return (
        <PublicLayout>
            <Head title={t('Servicios · Crown Barber')}>
                <meta
                    name="description"
                    content={t(
                        'Explora los servicios de Crown Barber. Consulta precios, duración y elige tu próximo corte o cuidado de barba.',
                    )}
                />
            </Head>
            <PageIntro
                number="01"
                label={t('NUESTROS SERVICIOS')}
                title={
                    <>
                        {t('El detalle.')} <br />
                        <span className="crown-accent">
                            {t('Tu diferencia.')}
                        </span>
                    </>
                }
                description={t(
                    'Del corte que ya es tu firma a ese cambio que llevas tiempo imaginando. Encuentra tu próximo servicio.',
                )}
            />
            <div className="crown-container flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <label className="crown-search">
                    <span className="sr-only">{t('Buscar servicios')}</span>
                    <input
                        type="search"
                        placeholder={t('Buscar un servicio…')}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </label>
                <p className="text-sm text-[#726c63]" role="status">
                    {filtered.length}{' '}
                    {filtered.length === 1
                        ? t('servicio disponible')
                        : t('servicios disponibles')}
                </p>
            </div>
            {filtered.length === 0 && services.length > 0 ? (
                <div className="crown-container crown-section">
                    <div className="crown-empty">
                        <h2>{t('No encontramos ese servicio.')}</h2>
                        <p>
                            {t(
                                'Prueba con otro nombre o explora el catálogo completo.',
                            )}{' '}
                        </p>
                        <button
                            type="button"
                            className="crown-button"
                            onClick={() => setSearch('')}
                        >
                            {t('Ver todos los servicios')}{' '}
                        </button>
                    </div>
                </div>
            ) : (
                <ServiceList services={filtered} />
            )}
        </PublicLayout>
    );
}
