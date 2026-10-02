import { Badge } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import type { Translator } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@/types';

const styles: Record<AppointmentStatus, string> = {
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    proposed: 'border-blue-200 bg-blue-50 text-blue-700',
    confirmed: 'border-green-200 bg-green-50 text-green-700',
    cancelled: 'border-red-200 bg-red-50 text-red-600',
    completed: 'border-neutral-300 bg-neutral-100 text-neutral-700',
};

const labels = (t: Translator): Record<AppointmentStatus, string> => ({
    pending: t('Pendiente'),
    proposed: t('Nueva hora propuesta'),
    confirmed: t('Confirmada'),
    cancelled: t('Cancelada'),
    completed: t('Completada'),
});

export default function StatusBadge({
    status,
    className,
}: {
    status: AppointmentStatus;
    className?: string;
}) {
    const { t } = useTranslation();

    return (
        <Badge
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-tight',
                styles[status],
                className,
            )}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {labels(t)[status]}
        </Badge>
    );
}
