import { Head } from '@inertiajs/react';
import { BarberList, PageIntro } from '@/Components/PublicSections';
import type { PublicBarber } from '@/Components/PublicSections';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTranslation } from '@/lib/i18n';

export default function Barbers({ barbers }: { barbers: PublicBarber[] }) {
    const { t } = useTranslation();

    return (
        <PublicLayout>
            <Head title={t('Barberos · Crown Barber')}>
                <meta
                    name="description"
                    content={t(
                        'Conoce al equipo de Crown Barber y elige al barbero de tu próxima cita.',
                    )}
                />
            </Head>
            <PageIntro
                number="02"
                label={t('EL EQUIPO CROWN')}
                title={
                    <>
                        {t('El oficio en')} <br />
                        <span className="crown-accent">
                            {t('buenas manos.')}
                        </span>
                    </>
                }
                description={t(
                    'Detrás de cada corte hay alguien que escucha, observa y cuida los detalles. Conoce al equipo y elige con quién va tu estilo.',
                )}
            />
            <BarberList barbers={barbers} />
            <section className="crown-container crown-section border-t border-black/15">
                <p className="crown-eyebrow">
                    {t('UNA CONVERSACIÓN ANTES DE EMPEZAR')}{' '}
                </p>
                <p className="crown-display mt-6 max-w-4xl text-4xl md:text-6xl">
                    {t('Trae una idea.')} <br />
                    {t('Démosle tu personalidad.')}{' '}
                </p>
                <p className="crown-copy mt-6 max-w-lg">
                    {t(
                        'Un estilo de referencia, tu rutina o simplemente lo que te gustaría cambiar. Cuéntaselo a tu barbero cuando llegues.',
                    )}{' '}
                </p>
            </section>
        </PublicLayout>
    );
}
