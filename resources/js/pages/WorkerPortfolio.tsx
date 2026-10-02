import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import WorkerPortfolioView from '@/Components/WorkerPortfolioView';
import PublicLayout, { BookingLink } from '@/Layouts/PublicLayout';
import { useTranslation } from '@/lib/i18n';
import { barbers } from '@/routes/public';
import type { WorkerProfile } from '@/types';

export default function WorkerPortfolio({ worker }: { worker: WorkerProfile }) {
    const { t } = useTranslation();

    return (
        <PublicLayout>
            <Head title={t('{name} · Sus trabajos', { name: worker.name })} />
            <div className="crown-container py-10 sm:py-16">
                <Link
                    href={barbers()}
                    className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-black/60"
                >
                    <ArrowLeft size={16} /> {t('Volver al equipo')}{' '}
                </Link>
                <div className="mx-auto max-w-4xl">
                    <WorkerPortfolioView worker={worker} />
                    <div className="mt-8 border-t border-black/15 pt-6">
                        <BookingLink query={{ barber: worker.id }}>
                            {t('Reservar con')} {worker.name}
                        </BookingLink>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
