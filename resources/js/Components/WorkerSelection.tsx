import { Modal } from '@heroui/react';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Check, Images } from 'lucide-react';
import { useState } from 'react';
import { NativeButton } from '@/Components/Watermelon';
import WorkerAvatar from '@/Components/WorkerAvatar';
import WorkerPortfolioView from '@/Components/WorkerPortfolioView';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { worker as workerRoute } from '@/routes/public';
import type { WorkerProfile } from '@/types';

export default function WorkerSelection({
    workers,
    selectedId,
    onSelect,
}: {
    workers: WorkerProfile[];
    selectedId: number | string;
    onSelect: (id: number) => void;
}) {
    const { t } = useTranslation();

    const [viewing, setViewing] = useState<WorkerProfile | null>(null);

    return (
        <>
            <div className="mb-6 max-w-lg">
                <h2 className="text-2xl font-bold tracking-tight">
                    {t('Encuentra tus buenas manos.')}{' '}
                </h2>
                <p className="mt-2 text-sm leading-6 text-black/55">
                    {t(
                        'Conoce su especialidad, mira sus trabajos y elige con quién va tu estilo.',
                    )}{' '}
                </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {workers.map((worker) => {
                    const selected = Number(selectedId) === worker.id;

                    return (
                        <article
                            key={worker.id}
                            className={cn(
                                'wm-card overflow-hidden rounded-3xl border bg-white transition-colors',
                                selected
                                    ? 'border-black ring-1 ring-black'
                                    : 'border-black/10',
                            )}
                        >
                            <button
                                type="button"
                                aria-pressed={selected}
                                aria-label={t('Elegir a {name}', {
                                    name: worker.name,
                                })}
                                onClick={() => onSelect(worker.id)}
                                className="block w-full text-left focus-visible:outline-2 focus-visible:-outline-offset-4"
                            >
                                <div className="relative">
                                    <img
                                        src={worker.cover_photo_url}
                                        alt={t('Portada de {name}', {
                                            name: worker.name,
                                        })}
                                        loading="lazy"
                                        className="aspect-[16/10] w-full bg-stone-100 object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src =
                                                '/worker-cover.svg';
                                        }}
                                    />
                                    {selected && (
                                        <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
                                            <Check size={13} />{' '}
                                            {t('Tu elección')}{' '}
                                        </span>
                                    )}
                                </div>
                                <div className="relative px-5 pt-1 pb-4">
                                    <WorkerAvatar
                                        src={worker.profile_photo_url}
                                        name={worker.name}
                                        className="-mt-9 size-20 shadow-sm"
                                    />
                                    <h3 className="mt-3 text-xl font-bold tracking-tight break-words">
                                        {worker.name}
                                    </h3>
                                    <p className="mt-1 text-sm font-medium text-black/65">
                                        {worker.specialty ||
                                            t('Barbería y cuidado personal')}
                                    </p>
                                    <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-black/50">
                                        {worker.description ||
                                            t(
                                                'El detalle empieza por elegir a tu barbero.',
                                            )}
                                    </p>
                                    <span
                                        className={cn(
                                            'mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold',
                                            selected
                                                ? 'bg-black text-white'
                                                : 'bg-stone-100 text-black',
                                        )}
                                    >
                                        {selected ? (
                                            <>
                                                <Check size={16} />{' '}
                                                {t('Seleccionado')}{' '}
                                            </>
                                        ) : (
                                            t('Elegir trabajador')
                                        )}
                                    </span>
                                </div>
                            </button>
                            <div className="px-5 pb-5">
                                <NativeButton
                                    type="button"
                                    onClick={() => setViewing(worker)}
                                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-black/15 text-sm font-semibold"
                                >
                                    <Images size={16} />{' '}
                                    {t('Ver trabajos')}{' '}
                                </NativeButton>
                            </div>
                        </article>
                    );
                })}
            </div>
            {!workers.length && (
                <p className="rounded-2xl bg-stone-100 p-6 text-sm text-black/60">
                    {t('Por ahora no hay trabajadores disponibles.')}{' '}
                </p>
            )}
            <Modal
                isOpen={viewing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewing(null);
                    }
                }}
            >
                <Modal.Backdrop>
                    <Modal.Container size="lg">
                        <Modal.Dialog className="wm-overlay max-h-[90dvh] overflow-y-auto bg-white text-black">
                            <Modal.CloseTrigger />
                            <Modal.Header>
                                <Modal.Heading>
                                    {t('Conoce a tu trabajador')}{' '}
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                {viewing && (
                                    <WorkerPortfolioView
                                        key={viewing.id}
                                        worker={viewing}
                                    />
                                )}
                            </Modal.Body>
                            <Modal.Footer className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                                {viewing && (
                                    <>
                                        <Link
                                            href={workerRoute.url(viewing.id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium"
                                        >
                                            {t('Ver perfil completo')}{' '}
                                            <ArrowUpRight size={15} />
                                        </Link>
                                        <NativeButton
                                            type="button"
                                            onClick={() => {
                                                onSelect(viewing.id);
                                                setViewing(null);
                                            }}
                                            className="min-h-12 rounded-xl bg-black px-6 text-sm font-semibold text-white"
                                        >
                                            {t('Elegir a')} {viewing.name}
                                        </NativeButton>
                                    </>
                                )}
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    );
}
