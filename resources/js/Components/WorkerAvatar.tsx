import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function WorkerAvatar({
    src,
    name,
    className,
}: {
    src: string;
    name: string;
    className?: string;
}) {
    const { t } = useTranslation();

    return (
        <img
            src={src}
            alt={t('Foto de {name}', { name: name })}
            className={cn(
                'size-16 shrink-0 rounded-full border-4 border-white bg-stone-100 object-cover',
                className,
            )}
            onError={(event) => {
                if (!event.currentTarget.src.endsWith('/worker-avatar.svg')) {
                    event.currentTarget.src = '/worker-avatar.svg';
                }
            }}
        />
    );
}
