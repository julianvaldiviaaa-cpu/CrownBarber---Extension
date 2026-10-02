import { Link } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUpRight,
    Clock,
    Crown,
    Plus,
    Scissors,
} from 'lucide-react';
import type { ReactNode } from 'react';
import WorkerAvatar from '@/Components/WorkerAvatar';
import { BookingLink } from '@/Layouts/PublicLayout';
import type { Translator } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n';
import {
    services as servicesRoute,
    barbers as barbersRoute,
    worker as workerRoute,
} from '@/routes/public';
import type { WorkerProfile } from '@/types';

export type PublicService = {
    id: number;
    name: string;
    description: string | null;
    price: string;
    duration: number;
    slug: string;
    branches: { id: number; name: string }[];
};
export type PublicBarber = WorkerProfile;

export function Reveal({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={`crown-reveal ${className}`}>{children}</div>;
}

export function PageIntro({
    number,
    label,
    title,
    description,
}: {
    number: string;
    label: string;
    title: ReactNode;
    description: string;
}) {
    return (
        <section className="crown-container crown-page-intro">
            <p className="crown-eyebrow">
                <span className="crown-accent">{number} /</span> {label}
            </p>
            <h1 className="crown-display">{title}</h1>
            <div className="flex items-end justify-between gap-8">
                <p className="crown-copy max-w-xl">{description}</p>
                <ArrowDown
                    className="hidden sm:block"
                    size={30}
                    aria-hidden="true"
                />
            </div>
        </section>
    );
}

export function ServiceList({
    services,
    preview = false,
}: {
    services: PublicService[];
    preview?: boolean;
}) {
    const { t, intlLocale } = useTranslation();

    return (
        <section className="crown-container crown-section">
            {preview && (
                <div className="crown-section-heading">
                    <div>
                        <p className="crown-eyebrow">
                            {t('01 / EL ARTE DEL DETALLE')}{' '}
                        </p>
                        <h2 className="crown-display">{t('A tu medida.')}</h2>
                    </div>
                    <Link href={servicesRoute()} className="crown-text-link">
                        {t('Todos los servicios')} <ArrowUpRight size={18} />
                    </Link>
                </div>
            )}
            {services.length === 0 ? (
                <div className="crown-empty">
                    <Scissors size={32} />
                    <h2>{t('Estamos preparando el catálogo.')}</h2>
                    <p>
                        {t(
                            'Muy pronto podrás consultar aquí nuestros servicios y precios.',
                        )}{' '}
                    </p>
                </div>
            ) : (
                <div className="crown-service-list">
                    {services.map((service, index) => (
                        <Reveal key={service.id}>
                            <article className="crown-service-row">
                                <span className="crown-service-number">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="min-w-0">
                                    <h3>{service.name}</h3>
                                    <p>
                                        {service.description ||
                                            t(
                                                'Un servicio pensado para darle personalidad a tu estilo.',
                                            )}
                                    </p>
                                    <p className="mt-2 text-xs text-[#726c63]">
                                        {t('Disponible en')}:{' '}
                                        {service.branches
                                            .map((branch) => branch.name)
                                            .join(', ')}
                                    </p>
                                </div>
                                <span className="crown-duration">
                                    <Clock size={14} aria-hidden="true" />
                                    {service.duration} {t('min')}{' '}
                                </span>
                                <span className="crown-price">
                                    {new Intl.NumberFormat(intlLocale, {
                                        style: 'currency',
                                        currency: 'MXN',
                                        maximumFractionDigits: 2,
                                    }).format(Number(service.price))}
                                    <small>MXN</small>
                                </span>
                                <BookingLink
                                    query={{ service: service.id }}
                                    className="crown-service-book"
                                >
                                    <span className="sr-only">
                                        {t('Reservar')} {service.name}
                                    </span>
                                </BookingLink>
                            </article>
                        </Reveal>
                    ))}
                </div>
            )}
            <p className="mt-6 text-xs text-[#726c63]">
                {t(
                    'Precios en pesos mexicanos. La duración indicada es aproximada.',
                )}{' '}
            </p>
        </section>
    );
}

export function BarberList({
    barbers,
    preview = false,
}: {
    barbers: PublicBarber[];
    preview?: boolean;
}) {
    const { t } = useTranslation();

    return (
        <section className="crown-container crown-section">
            {preview && (
                <div className="crown-section-heading">
                    <div>
                        <p className="crown-eyebrow">
                            {t('03 / EL EQUIPO CROWN')}
                        </p>
                        <h2 className="crown-display">
                            {t('Buenas manos.')} <br />
                            {t('Mejor estilo.')}{' '}
                        </h2>
                    </div>
                    <Link href={barbersRoute()} className="crown-text-link">
                        {t('Conoce al equipo')} <ArrowUpRight size={18} />
                    </Link>
                </div>
            )}
            {barbers.length === 0 ? (
                <div className="crown-empty">
                    <Crown size={32} />
                    <h2>{t('El equipo está por llegar.')}</h2>
                    <p>
                        {t(
                            'Los barberos disponibles aparecerán aquí cuando se incorporen.',
                        )}{' '}
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {barbers.map((barber, index) => (
                        <Reveal key={barber.id}>
                            <article
                                className={`crown-barber crown-barber-${index % 4}`}
                            >
                                <div className="crown-barber-art relative overflow-hidden">
                                    <img
                                        src={barber.cover_photo_url}
                                        alt={t('Portada de {name}', {
                                            name: barber.name,
                                        })}
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-3 py-5">
                                    <WorkerAvatar
                                        src={barber.profile_photo_url}
                                        name={barber.name}
                                        className="size-12 border-2"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-semibold wrap-break-word">
                                            {barber.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-[#726c63]">
                                            {barber.specialty ||
                                                t('Barbero · Crown Barber')}
                                        </p>
                                    </div>
                                    <BookingLink
                                        query={{ barber: barber.id }}
                                        className="crown-round-link"
                                    >
                                        <span className="sr-only">
                                            {t('Reservar con')} {barber.name}
                                        </span>
                                    </BookingLink>
                                </div>
                                <Link
                                    href={workerRoute.url(barber.id)}
                                    className="flex min-h-11 items-center gap-2 text-sm font-semibold"
                                >
                                    {t('Ver sus trabajos')}{' '}
                                    <ArrowUpRight size={16} />
                                </Link>
                            </article>
                        </Reveal>
                    ))}
                </div>
            )}
        </section>
    );
}

export const steps = (t: Translator) => [
    {
        number: '01',
        title: t('Encuentra tu estilo.'),
        copy: t(
            'Explora los servicios y elige lo que necesitas. Verás el precio y la duración antes de reservar.',
        ),
    },
    {
        number: '02',
        title: t('Elige tu momento.'),
        copy: t(
            'Crea tu cuenta, verifica tu correo y selecciona tu barbero, el día y una hora disponible.',
        ),
    },
    {
        number: '03',
        title: t('Nos vemos en la silla.'),
        copy: t(
            'Tu barbero revisará la solicitud. Consulta en tu cuenta la confirmación o una propuesta de horario.',
        ),
    },
];

export function Steps() {
    const { t } = useTranslation();

    return (
        <div className="grid gap-10 md:grid-cols-3">
            {steps(t).map((step) => (
                <Reveal key={step.number}>
                    <div className="crown-step">
                        <span>{step.number}</span>
                        <h3>{step.title}</h3>
                        <p>{step.copy}</p>
                    </div>
                </Reveal>
            ))}
        </div>
    );
}

export function Faq() {
    const { t } = useTranslation();

    const questions = [
        [
            t('¿Necesito una cuenta para reservar?'),
            t(
                'Sí. Crea tu cuenta y verifica tu correo electrónico para solicitar una cita. Desde ahí podrás consultar tus reservas y las respuestas de tu barbero.',
            ),
        ],
        [
            t('¿Mi cita se confirma al reservar?'),
            t(
                'Tu solicitud queda pendiente hasta que el barbero la confirme. Si propone otra hora, podrás aceptarla o responder desde el detalle de tu cita.',
            ),
        ],
        [
            t('¿Puedo elegir a mi barbero?'),
            t(
                'Sí. Al reservar puedes seleccionar cualquiera de los barberos disponibles y consultar sus horarios libres para los servicios que elegiste.',
            ),
        ],
        [
            t('¿Puedo cambiar o cancelar mi cita?'),
            t(
                'Puedes proponer otra hora o cancelar una cita futura desde tu cuenta, según su estado. Revisa los botones disponibles en el detalle de la reserva.',
            ),
        ],
        [
            t('¿Puedo reservar varios servicios?'),
            t(
                'Sí. Puedes combinar servicios en una misma cita. El sistema suma sus precios y duración para mostrarte los horarios disponibles.',
            ),
        ],
    ];

    return (
        <section className="crown-container crown-section grid gap-12 lg:grid-cols-2">
            <div>
                <p className="crown-eyebrow">{t('SIN COMPLICACIONES')}</p>
                <h2 className="crown-display mt-5 text-5xl">
                    {t('Antes de venir.')}
                </h2>
                <p className="crown-copy mt-6 max-w-sm">
                    {t(
                        'Todo lo que necesitas saber para disfrutar tu próxima visita.',
                    )}{' '}
                </p>
            </div>
            <div>
                {questions.map(([question, answer]) => (
                    <details className="crown-faq" key={question}>
                        <summary>
                            {question}
                            <Plus size={20} aria-hidden="true" />
                        </summary>
                        <p>{answer}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}
