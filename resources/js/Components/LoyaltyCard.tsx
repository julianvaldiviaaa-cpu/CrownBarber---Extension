import { Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    Check,
    Crown,
    Gift,
    Scissors,
    Sparkles,
} from 'lucide-react';
import { Badge, Progress } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { loyalty as loyaltyRoute } from '@/routes';
import type { Loyalty } from '@/types';

export default function LoyaltyCard({
    loyalty,
    showLink = true,
    customerName,
}: {
    loyalty: Loyalty;
    showLink?: boolean;
    customerName?: string;
}) {
    const { t } = useTranslation();

    const ready = loyalty.rewards_available > 0;

    return (
        <section
            aria-label={t('Tarjeta de fidelidad')}
            className="relative overflow-hidden rounded-3xl bg-neutral-950 p-6 text-white sm:p-8"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 -right-10 size-56 rounded-full border border-white/5"
            />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-white/55 uppercase">
                        <Crown size={16} /> {t('Crown Club')}{' '}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                        {customerName
                            ? t('Fidelidad de {name}', { name: customerName })
                            : t('Tu lealtad tiene recompensa.')}
                    </h2>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-white/65">
                        {t(
                            'Nueve visitas pagadas. En tu décima visita, un corte de cabello o un facial va por nuestra cuenta.',
                        )}{' '}
                    </p>
                </div>
                <Badge
                    className={cn(
                        'border-white/15 px-3 py-1.5',
                        ready ? 'bg-white text-black' : 'text-white/70',
                    )}
                >
                    <Gift size={14} />
                    {ready
                        ? t('Premio disponible')
                        : t('{count} de 10 días', { count: loyalty.stamps })}
                </Badge>
            </div>
            <ol
                className="relative my-7 grid grid-cols-5 gap-2.5 sm:grid-cols-10"
                aria-label={t('Sellos de visitas')}
            >
                {Array.from({ length: 10 }, (_, index) => {
                    const filled = index < loyalty.stamps;

                    return (
                        <li
                            key={index}
                            aria-label={
                                index === 9
                                    ? t('Día 10: corte o facial gratis')
                                    : t('Día {day}: {status}', {
                                          day: index + 1,
                                          status: filled
                                              ? t('completado')
                                              : t('pendiente'),
                                      })
                            }
                            className={cn(
                                'wm-stamp flex aspect-square min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border',
                                filled
                                    ? 'border-white bg-white text-black'
                                    : index === 9
                                      ? 'border-dashed border-white/50 bg-white/10 text-white'
                                      : 'border-white/10 text-white/35',
                            )}
                            data-filled={filled}
                        >
                            {index === 9 ? (
                                <Gift size={22} aria-hidden="true" />
                            ) : filled ? (
                                <Check size={22} aria-hidden="true" />
                            ) : (
                                <Scissors size={18} aria-hidden="true" />
                            )}
                            <span className="text-[10px] font-semibold tracking-wider">
                                {index === 9
                                    ? t('GRATIS')
                                    : String(index + 1).padStart(2, '0')}
                            </span>
                        </li>
                    );
                })}
            </ol>
            <Progress
                value={loyalty.stamps}
                label={t('Progreso de la tarjeta de fidelidad')}
            />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="flex items-center gap-2 text-white/65">
                    <Sparkles size={15} />
                    {ready
                        ? t('Elige tu corte o facial en tu próxima visita.')
                        : t(
                              'Te faltan {count} visitas pagadas para desbloquear tu premio.',
                              { count: 9 - loyalty.stamps },
                          )}
                </p>
                {showLink && (
                    <Link
                        href={loyaltyRoute()}
                        className="inline-flex min-h-11 items-center gap-2 font-medium text-white"
                    >
                        {t('Ver mi tarjeta')} <ArrowUpRight size={16} />
                    </Link>
                )}
            </div>
            <p className="mt-3 text-xs leading-5 text-white/40">
                {t(
                    'Un sello por día de atención. No necesitan ser días consecutivos. Las citas confirmadas suman al terminar su duración.',
                )}{' '}
            </p>
        </section>
    );
}
