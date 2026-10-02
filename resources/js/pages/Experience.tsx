import { Head } from '@inertiajs/react';
import { Faq, PageIntro, Steps } from '@/Components/PublicSections';
import PublicLayout, { BookingLink } from '@/Layouts/PublicLayout';
import type { Translator } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n';
import type { BusinessHour } from '@/types';

const days = (t: Translator) => [
    t('Lunes'),
    t('Martes'),
    t('Miércoles'),
    t('Jueves'),
    t('Viernes'),
    t('Sábado'),
    t('Domingo'),
];

export default function Experience({ hours }: { hours: BusinessHour[] }) {
    const { t } = useTranslation();

    return (
        <PublicLayout>
            <Head title={t('Cómo funciona · Crown Barber')}>
                <meta
                    name="description"
                    content={t(
                        'Reserva en Crown Barber en tres pasos. Conoce nuestros horarios y resuelve tus dudas sobre citas, cambios y confirmaciones.',
                    )}
                />
            </Head>
            <PageIntro
                number="03"
                label={t('LA EXPERIENCIA CROWN')}
                title={
                    <>
                        {t('Menos vueltas.')} <br />
                        <span className="crown-accent">{t('Más estilo.')}</span>
                    </>
                }
                description={t(
                    'Tu tiempo cuenta. Elige tu servicio, encuentra una hora y deja que nosotros nos ocupemos de los detalles.',
                )}
            />
            <section className="crown-container crown-section">
                <Steps />
                <div className="mt-12">
                    <BookingLink />
                </div>
            </section>
            <section className="crown-hours">
                <div className="crown-container grid gap-12 lg:grid-cols-2">
                    <div>
                        <p className="crown-eyebrow">
                            {t('HAZLE UN ESPACIO A TU ESTILO')}{' '}
                        </p>
                        <h2 className="crown-display mt-6">
                            {t('Encuentra')} <br />
                            {t('tu momento.')}{' '}
                        </h2>
                        <p className="crown-copy mt-6 max-w-md">
                            {t(
                                'Estos son nuestros horarios habituales. Al reservar verás la disponibilidad de tu barbero y los cambios de horario para fechas especiales.',
                            )}{' '}
                        </p>
                    </div>
                    <div>
                        {hours.length === 0 ? (
                            <p className="crown-copy">
                                {t(
                                    'Estamos preparando nuestros horarios. Vuelve pronto para consultar la disponibilidad.',
                                )}{' '}
                            </p>
                        ) : (
                            days(t).map((day, index) => {
                                const hour = hours.find(
                                    (entry) => entry.day_of_week === index,
                                );

                                return (
                                    <div className="crown-hour-row" key={day}>
                                        <span>{day}</span>
                                        <span>
                                            {hour?.active
                                                ? `${hour.open_time.slice(0, 5)} — ${hour.close_time.slice(0, 5)}`
                                                : t('Cerrado')}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
            <Faq />
        </PublicLayout>
    );
}
