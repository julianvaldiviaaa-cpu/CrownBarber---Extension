import { Modal } from '@heroui/react';
import { ChevronLeft, ChevronRight, Images, Scissors } from 'lucide-react';
import { useState } from 'react';
import WorkerAvatar from '@/Components/WorkerAvatar';
import { useTranslation } from '@/lib/i18n';
import type { WorkerProfile } from '@/types';

export default function WorkerPortfolioView({
    worker,
}: {
    worker: WorkerProfile;
}) {
    const { t } = useTranslation();

    const [photoIndex, setPhotoIndex] = useState<number | null>(null);
    const photo = photoIndex === null ? null : worker.gallery[photoIndex];

    return (
        <div className="min-w-0">
            <img
                src={worker.cover_photo_url}
                alt={t('Portada de {name}', { name: worker.name })}
                className="aspect-[16/9] w-full rounded-2xl bg-stone-100 object-cover sm:aspect-[21/8]"
                onError={(e) => {
                    e.currentTarget.src = '/worker-cover.svg';
                }}
            />
            <div className="relative px-2 pb-6 sm:px-6">
                <WorkerAvatar
                    src={worker.profile_photo_url}
                    name={worker.name}
                    className="-mt-10 size-24 shadow-sm sm:size-28"
                />
                <div className="mt-4 flex flex-col gap-3">
                    <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-black/50 uppercase">
                        <Scissors size={14} /> {t('Equipo Crown')}{' '}
                    </p>
                    <h2 className="text-3xl font-bold tracking-tight break-words text-black sm:text-4xl">
                        {worker.name}
                    </h2>
                    <p className="text-base font-medium text-black/70">
                        {worker.specialty || t('Barbería y cuidado personal')}
                    </p>
                    <p className="max-w-2xl text-sm leading-7 whitespace-pre-line text-black/60">
                        {worker.description ||
                            t(
                                'Conoce sus trabajos y elige el estilo de tu próxima visita.',
                            )}
                    </p>
                </div>
            </div>
            <div className="border-t border-black/10 pt-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <Images size={19} /> {t('Sus trabajos')}{' '}
                    </h3>
                    <span className="text-xs text-black/45">
                        {worker.gallery.length} {t('fotos')}{' '}
                    </span>
                </div>
                {worker.gallery.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {worker.gallery.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setPhotoIndex(index)}
                                aria-label={t(
                                    'Ampliar trabajo {number} de {name}',
                                    { number: index + 1, name: worker.name },
                                )}
                                className="group overflow-hidden rounded-xl bg-stone-100 outline-offset-4 focus-visible:outline-2"
                            >
                                <img
                                    src={item.url}
                                    alt={t('Trabajo {number} de {name}', {
                                        number: index + 1,
                                        name: worker.name,
                                    })}
                                    loading="lazy"
                                    className="aspect-[4/5] w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
                                />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-black/15 px-5 py-10 text-center">
                        <Images size={28} className="mx-auto text-black/25" />
                        <p className="mt-3 text-sm text-black/60">
                            {t(
                                'Este trabajador aún no ha publicado fotos de sus trabajos.',
                            )}{' '}
                        </p>
                    </div>
                )}
            </div>
            <Modal
                isOpen={photo !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPhotoIndex(null);
                    }
                }}
            >
                <Modal.Backdrop>
                    <Modal.Container size="lg">
                        <Modal.Dialog className="max-h-[90dvh] overflow-y-auto bg-white text-black">
                            <Modal.CloseTrigger />
                            <Modal.Header>
                                <Modal.Heading>
                                    {t('Trabajo de')} {worker.name}
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                {photo && (
                                    <img
                                        src={photo.url}
                                        alt={t(
                                            'Trabajo de {name}, foto {number}',
                                            {
                                                name: worker.name,
                                                number: (photoIndex ?? 0) + 1,
                                            },
                                        )}
                                        className="max-h-[65dvh] w-full rounded-xl object-contain"
                                    />
                                )}
                            </Modal.Body>
                            <Modal.Footer className="flex items-center justify-between">
                                <button
                                    type="button"
                                    aria-label={t('Foto anterior')}
                                    disabled={worker.gallery.length < 2}
                                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-black/15 disabled:opacity-30"
                                    onClick={() =>
                                        setPhotoIndex(
                                            ((photoIndex ?? 0) -
                                                1 +
                                                worker.gallery.length) %
                                                worker.gallery.length,
                                        )
                                    }
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm">
                                    {(photoIndex ?? 0) + 1} /{' '}
                                    {worker.gallery.length}
                                </span>
                                <button
                                    type="button"
                                    aria-label={t('Foto siguiente')}
                                    disabled={worker.gallery.length < 2}
                                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-black/15 disabled:opacity-30"
                                    onClick={() =>
                                        setPhotoIndex(
                                            ((photoIndex ?? 0) + 1) %
                                                worker.gallery.length,
                                        )
                                    }
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    );
}
