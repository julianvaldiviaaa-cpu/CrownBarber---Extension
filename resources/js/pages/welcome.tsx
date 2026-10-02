import { Head, Link } from '@inertiajs/react';
import { ArrowDown, ArrowUpRight, Crown } from 'lucide-react';
import {
    BarberList,
    Reveal,
    ServiceList,
    Steps,
} from '@/Components/PublicSections';
import type { PublicBarber, PublicService } from '@/Components/PublicSections';
import PublicLayout, { BookingLink } from '@/Layouts/PublicLayout';
import { useTranslation } from '@/lib/i18n';
import { experience, services as servicesRoute } from '@/routes/public';

export default function Welcome({
    services,
    barbers,
}: {
    services: PublicService[];
    barbers: PublicBarber[];
}) {
    const { t } = useTranslation();

    return (
        <PublicLayout>
            <Head title={t('Crown Barber · El arte de llevar tu estilo')}>
                <meta
                    name="description"
                    content={t(
                        'El oficio de la barbería, elevado al detalle. Descubre Crown Barber, conoce a nuestro equipo y reserva un momento para ti.',
                    )}
                />
            </Head>

            <section className="crown-cinematic" aria-labelledby="hero-title">
                <div className="crown-cinematic-media">
                    <img
                        className="crown-cinematic-photo"
                        src="/crown-barber-studio.jpg"
                        alt={t(
                            'Un barbero perfila cuidadosamente la barba de un cliente',
                        )}
                        width="1400"
                        height="933"
                        fetchPriority="high"
                    />
                </div>
                <div className="crown-cinematic-shade" />
                <div className="crown-container crown-cinematic-content">
                    <div className="crown-cinematic-topline">
                        <span className="crown-edition">
                            {t('EL OFICIO. EL DETALLE. TÚ.')}{' '}
                        </span>
                    </div>
                    <h1 id="hero-title" className="crown-cinematic-title">
                        <span data-split-intro>{t('El arte de')}</span>
                        <em data-split-intro>{t('llevar tu estilo.')}</em>
                    </h1>
                    <div className="crown-cinematic-bottom">
                        <div className="crown-cinematic-description">
                            <p>
                                {t('Más que un corte. Un ritual personal.')}{' '}
                                <br />
                                {t('Un momento para volver a ti.')}{' '}
                            </p>
                            <BookingLink className="crown-button crown-button-brass" />
                        </div>
                        <a className="crown-scroll-cue" href="#descubre">
                            <span>{t('DESLIZA PARA DESCUBRIR')}</span>
                            <ArrowDown size={18} aria-hidden="true" />
                        </a>
                    </div>
                    <span className="crown-cinematic-index" aria-hidden="true">
                        01 — 04
                    </span>
                </div>
            </section>

            <section
                className="crown-ritual"
                id="descubre"
                aria-labelledby="ritual-title"
            >
                <div className="crown-container crown-ritual-stage">
                    <div className="crown-ritual-heading">
                        <p className="crown-eyebrow">
                            {t('LA FILOSOFÍA CROWN')}
                        </p>
                        <span
                            className="crown-ritual-emblem"
                            aria-hidden="true"
                        >
                            <Crown strokeWidth={1} size={30} />
                        </span>
                    </div>
                    <h2
                        id="ritual-title"
                        className="crown-ritual-statement"
                        data-split-scrub
                    >
                        {t(
                            'El verdadero estilo no necesita llamar la atención. Se reconoce en cada detalle.',
                        )}{' '}
                    </h2>
                    <div className="crown-ritual-foot">
                        <span>{t('PRECISIÓN EN EL CORTE.')}</span>
                        <span>{t('PERSONALIDAD EN EL RESULTADO.')}</span>
                    </div>
                    <div className="crown-ritual-line" aria-hidden="true" />
                </div>
            </section>

            <div className="crown-catalog-intro crown-container">
                <p className="crown-eyebrow">
                    {t('ELIGE CÓMO QUIERES SENTIRTE')}
                </p>
                <span className="crown-edition">
                    {t('CROWN BARBER / SERVICIOS')}
                </span>
            </div>
            <ServiceList services={services} preview />

            <section className="crown-story">
                <div className="crown-container crown-story-grid">
                    <div className="crown-atelier-art" aria-hidden="true">
                        <div className="crown-atelier-frame">
                            <Crown size={74} strokeWidth={0.65} />
                            <span className="crown-atelier-monogram">CB.</span>
                            <span className="crown-eyebrow">
                                {t('DEDICADOS AL DETALLE')}{' '}
                            </span>
                        </div>
                        <span className="crown-atelier-caption">
                            {t('UN OFICIO QUE SE SIENTE.')}{' '}
                        </span>
                    </div>
                    <div className="crown-story-copy">
                        <p className="crown-eyebrow">
                            {t('02 / LA EXPERIENCIA')}
                        </p>
                        <h2 className="crown-display">
                            {t('El tiempo se detiene.')} <br />
                            <em>{t('Tu estilo, no.')}</em>
                        </h2>
                        <Reveal>
                            <p className="crown-copy">
                                {t(
                                    'La silla, la conversación, el sonido de las tijeras. Hay momentos que merecen disfrutarse sin prisa.',
                                )}{' '}
                            </p>
                            <p className="crown-copy">
                                {t(
                                    'Nos gusta escuchar lo que buscas y cuidar lo que hace único a tu estilo. Del primer trazo al último detalle.',
                                )}{' '}
                            </p>
                            <Link
                                className="crown-text-link"
                                href={experience()}
                            >
                                {t('Descubre la experiencia')}{' '}
                                <ArrowUpRight size={18} />
                            </Link>
                        </Reveal>
                    </div>
                </div>
            </section>

            <BarberList barbers={barbers} preview />

            <section
                className="crown-detail-banner"
                data-parallax
                aria-label={t('El cuidado del detalle')}
            >
                <img
                    src="/crown-barber-studio.jpg"
                    alt={t(
                        'Detalle del trabajo a tijera en el cuidado de la barba',
                    )}
                    width="1400"
                    height="933"
                    loading="lazy"
                />
                <div className="crown-detail-shade" />
                <div className="crown-container crown-detail-caption">
                    <span className="crown-eyebrow">{t('LA FIRMA CROWN')}</span>
                    <p>
                        {t('Se ve bien.')} <br />
                        <em>{t('Se siente mejor.')}</em>
                    </p>
                    <Link href={servicesRoute()} className="crown-text-link">
                        {t('Encuentra tu servicio')} <ArrowUpRight size={18} />
                    </Link>
                </div>
            </section>

            <section className="crown-process">
                <div className="crown-container">
                    <div className="crown-section-heading">
                        <div>
                            <p className="crown-eyebrow">
                                {t('04 / TU PRÓXIMA VISITA')}{' '}
                            </p>
                            <h2 className="crown-display">
                                {t('Un momento para ti.')} <br />
                                <em>{t('Así de sencillo.')}</em>
                            </h2>
                        </div>
                        <Link className="crown-text-link" href={experience()}>
                            {t('Cómo funciona')} <ArrowUpRight size={18} />
                        </Link>
                    </div>
                    <Steps />
                </div>
            </section>
        </PublicLayout>
    );
}
