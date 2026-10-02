import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowUpRight,
    Camera,
    ImagePlus,
    Loader2,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { NativeButton, NativeInput, Textarea } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import { prepareWorkerPhoto } from '@/lib/worker-photos';
import { worker as workerRoute } from '@/routes/public';
import type { WorkerProfile } from '@/types';

type PortfolioForm = {
    _method: 'put';
    specialty: string;
    description: string;
    profile_photo: File | null;
    cover_photo: File | null;
    gallery_photos: File[];
    remove_profile_photo: boolean;
    remove_cover_photo: boolean;
    remove_gallery_ids: string[];
};

function PhotoPreview({
    file,
    fallback,
    className,
}: {
    file: File | null;
    fallback: string;
    className: string;
}) {
    const { t } = useTranslation();

    const url = useMemo(
        () => (file ? URL.createObjectURL(file) : fallback),
        [file, fallback],
    );
    useEffect(
        () => () => {
            if (file) {
                URL.revokeObjectURL(url);
            }
        },
        [file, url],
    );

    return (
        <img
            src={url}
            alt={t('Vista previa de la foto')}
            className={className}
        />
    );
}

export default function WorkerPortfolioEditor({
    worker,
    submitUrl,
}: {
    worker: WorkerProfile;
    submitUrl: string;
}) {
    const { t } = useTranslation();

    const form = useForm<PortfolioForm>({
        _method: 'put',
        specialty: worker.specialty ?? '',
        description: worker.description ?? '',
        profile_photo: null,
        cover_photo: null,
        gallery_photos: [],
        remove_profile_photo: false,
        remove_cover_photo: false,
        remove_gallery_ids: [],
    });
    const [preparing, setPreparing] = useState(false);
    const [fileError, setFileError] = useState('');
    const retained = worker.gallery.filter(
        (photo) => !form.data.remove_gallery_ids.includes(photo.id),
    );
    const count = retained.length + form.data.gallery_photos.length;

    useEffect(() => {
        if (!form.isDirty) {
            return;
        }

        const beforeUnload = (event: BeforeUnloadEvent) =>
            event.preventDefault();
        window.addEventListener('beforeunload', beforeUnload);
        const remove = router.on(
            'before',
            (event) =>
                event.detail.visit.method !== 'get' ||
                window.confirm(
                    t(
                        'Tienes cambios en el perfil sin guardar. ¿Quieres salir?',
                    ),
                ),
        );

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
            remove();
        };
    }, [form.isDirty, t]);

    async function pickPhotos(
        field: 'profile_photo' | 'cover_photo' | 'gallery_photos',
        files: File[],
    ) {
        setFileError('');

        if (!files.length) {
            return;
        }

        if (field === 'gallery_photos' && count + files.length > 12) {
            setFileError(
                t(
                    'Puedes publicar hasta 12 fotos. Quita alguna antes de añadir más.',
                ),
            );

            return;
        }

        setPreparing(true);

        try {
            const prepared: File[] = [];

            for (const file of files) {
                prepared.push(await prepareWorkerPhoto(file));
            }

            if (field === 'gallery_photos') {
                form.setData('gallery_photos', [
                    ...form.data.gallery_photos,
                    ...prepared,
                ]);
            } else {
                form.setData(field, prepared[0]);
                form.setData(
                    field === 'profile_photo'
                        ? 'remove_profile_photo'
                        : 'remove_cover_photo',
                    false,
                );
            }
        } catch (error) {
            setFileError(
                error instanceof Error
                    ? error.message
                    : t('No se pudieron preparar las fotos.'),
            );
        } finally {
            setPreparing(false);
        }
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        const files = [
            form.data.profile_photo,
            form.data.cover_photo,
            ...form.data.gallery_photos,
        ].filter((file): file is File => file !== null);

        if (files.reduce((sum, file) => sum + file.size, 0) > 6 * 1024 * 1024) {
            setFileError(
                t(
                    'Sube las fotos en grupos más pequeños y guarda entre cada grupo.',
                ),
            );

            return;
        }

        form.post(submitUrl, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults({
                    ...form.data,
                    profile_photo: null,
                    cover_photo: null,
                    gallery_photos: [],
                    remove_gallery_ids: [],
                    remove_profile_photo: false,
                    remove_cover_photo: false,
                });
                form.reset(
                    'profile_photo',
                    'cover_photo',
                    'gallery_photos',
                    'remove_gallery_ids',
                    'remove_profile_photo',
                    'remove_cover_photo',
                );
                setFileError('');
            },
        });
    }

    const busy = preparing || form.processing;

    return (
        <section className="rounded-3xl border border-black/10 bg-white p-5 sm:p-8">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                        {t('Lo que ven tus clientes')}{' '}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight">
                        {t('Perfil profesional')}{' '}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-black/55">
                        {t(
                            'Tu especialidad, tu estilo y tus trabajos. Las fotos se ajustan automáticamente para subirlas desde el celular.',
                        )}{' '}
                    </p>
                </div>
                <Link
                    href={workerRoute.url(worker.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center gap-2 text-sm font-semibold"
                >
                    {t('Ver mi perfil')} <ArrowUpRight size={16} />
                </Link>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-7">
                <fieldset
                    disabled={busy}
                    className="grid min-w-0 gap-5 sm:grid-cols-[180px_1fr]"
                >
                    <div className="flex flex-col gap-3">
                        <span className="text-sm font-semibold">
                            {t('Foto de perfil')}{' '}
                        </span>
                        <PhotoPreview
                            file={form.data.profile_photo}
                            fallback={
                                form.data.remove_profile_photo
                                    ? '/worker-avatar.svg'
                                    : worker.profile_photo_url
                            }
                            className="size-32 rounded-full bg-stone-100 object-cover ring-4 ring-stone-100"
                        />
                        <label className="relative flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/15 px-3 text-sm font-medium focus-within:ring-2">
                            <Camera size={16} /> {t('Elegir foto')}{' '}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                onChange={(event) => {
                                    void pickPhotos(
                                        'profile_photo',
                                        Array.from(event.target.files ?? []),
                                    );
                                    event.target.value = '';
                                }}
                            />
                        </label>
                        <NativeButton
                            type="button"
                            className="min-h-11 text-xs text-black/50 underline"
                            onClick={() => {
                                form.setData('profile_photo', null);
                                form.setData(
                                    'remove_profile_photo',
                                    !form.data.remove_profile_photo,
                                );
                            }}
                        >
                            {form.data.remove_profile_photo
                                ? t('Restaurar foto')
                                : t('Quitar foto')}
                        </NativeButton>
                    </div>
                    <div className="flex min-w-0 flex-col gap-3">
                        <span className="text-sm font-semibold">
                            {t('Foto principal / portada')}{' '}
                        </span>
                        <PhotoPreview
                            file={form.data.cover_photo}
                            fallback={
                                form.data.remove_cover_photo
                                    ? '/worker-cover.svg'
                                    : worker.cover_photo_url
                            }
                            className="aspect-[16/8] w-full rounded-2xl bg-stone-100 object-cover"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="relative flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/15 px-4 text-sm font-medium focus-within:ring-2">
                                <ImagePlus size={16} /> {t('Elegir portada')}{' '}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="sr-only"
                                    onChange={(event) => {
                                        void pickPhotos(
                                            'cover_photo',
                                            Array.from(
                                                event.target.files ?? [],
                                            ),
                                        );
                                        event.target.value = '';
                                    }}
                                />
                            </label>
                            <NativeButton
                                type="button"
                                className="min-h-11 text-xs text-black/50 underline"
                                onClick={() => {
                                    form.setData('cover_photo', null);
                                    form.setData(
                                        'remove_cover_photo',
                                        !form.data.remove_cover_photo,
                                    );
                                }}
                            >
                                {form.data.remove_cover_photo
                                    ? t('Restaurar portada')
                                    : t('Quitar portada')}
                            </NativeButton>
                        </div>
                    </div>
                </fieldset>
                <div className="grid gap-5">
                    <label className="flex flex-col gap-2 text-sm font-semibold">
                        {t('Especialidad')}{' '}
                        <NativeInput
                            value={form.data.specialty}
                            maxLength={120}
                            disabled={busy}
                            onChange={(e) =>
                                form.setData('specialty', e.target.value)
                            }
                            placeholder={t(
                                'Ej. Cortes clásicos, degradados y diseño de barba',
                            )}
                            className="min-h-12 w-full rounded-xl border border-black/15 px-4 font-normal"
                        />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold">
                        {t('Sobre tu trabajo')}{' '}
                        <Textarea
                            value={form.data.description}
                            maxLength={3000}
                            rows={5}
                            disabled={busy}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            placeholder={t(
                                'Cuéntales cómo trabajas y qué pueden esperar de su visita.',
                            )}
                            className="w-full border-black/15 font-normal"
                        />
                    </label>
                </div>
                <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-semibold">
                                {t('Galería de trabajos')}{' '}
                            </h3>
                            <p className="mt-1 text-sm text-black/50">
                                {count}{' '}
                                {t('de 12 fotos · JPG, PNG o WebP')}{' '}
                            </p>
                        </div>
                        <label className="relative flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/15 px-4 text-sm font-semibold focus-within:ring-2">
                            <ImagePlus size={17} /> {t('Añadir fotos')}{' '}
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                disabled={busy || count >= 12}
                                className="sr-only"
                                onChange={(event) => {
                                    void pickPhotos(
                                        'gallery_photos',
                                        Array.from(event.target.files ?? []),
                                    );
                                    event.target.value = '';
                                }}
                            />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {retained.map((photo) => (
                            <div
                                key={photo.id}
                                className="relative overflow-hidden rounded-xl bg-stone-100"
                            >
                                <img
                                    src={photo.url}
                                    alt={t('Trabajo publicado')}
                                    className="aspect-[4/5] w-full object-cover"
                                />
                                <NativeButton
                                    type="button"
                                    disabled={busy}
                                    aria-label={t('Quitar foto de la galería')}
                                    onClick={() =>
                                        form.setData('remove_gallery_ids', [
                                            ...form.data.remove_gallery_ids,
                                            photo.id,
                                        ])
                                    }
                                    className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-white/95 text-red-700 shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </NativeButton>
                            </div>
                        ))}
                        {form.data.gallery_photos.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="relative overflow-hidden rounded-xl bg-stone-100"
                            >
                                <PhotoPreview
                                    file={file}
                                    fallback=""
                                    className="aspect-[4/5] w-full object-cover"
                                />
                                <span className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-1 text-xs">
                                    {t('Sin guardar')}{' '}
                                </span>
                                <NativeButton
                                    type="button"
                                    disabled={busy}
                                    aria-label={t('Descartar foto nueva')}
                                    onClick={() =>
                                        form.setData(
                                            'gallery_photos',
                                            form.data.gallery_photos.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                    className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-white/95 shadow-sm"
                                >
                                    <X size={16} />
                                </NativeButton>
                            </div>
                        ))}
                    </div>
                    {!count && (
                        <p className="rounded-2xl border border-dashed border-black/15 px-5 py-8 text-center text-sm text-black/50">
                            {t(
                                'Añade tus primeros trabajos para que los clientes conozcan tu estilo.',
                            )}{' '}
                        </p>
                    )}
                    {form.data.remove_gallery_ids.length > 0 && (
                        <NativeButton
                            type="button"
                            disabled={busy}
                            onClick={() =>
                                form.setData('remove_gallery_ids', [])
                            }
                            className="mt-3 min-h-11 text-sm underline"
                        >
                            {t('Deshacer las fotos quitadas')}{' '}
                        </NativeButton>
                    )}
                </div>
                <div aria-live="polite" className="space-y-2">
                    {fileError && (
                        <p role="alert" className="text-sm text-red-700">
                            {t(fileError)}
                        </p>
                    )}
                    {Object.entries(form.errors).map(([key, error]) => (
                        <p
                            key={key}
                            role="alert"
                            className="text-sm text-red-700"
                        >
                            {t(error)}
                        </p>
                    ))}
                    {form.progress && (
                        <p className="text-sm text-black/60">
                            {t('Subiendo fotos:')} {form.progress.percentage}%
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-5">
                    <p className="text-xs text-black/50">
                        {t(
                            'Las fotos se publican cuando guardas el perfil.',
                        )}{' '}
                    </p>
                    <NativeButton
                        type="submit"
                        disabled={busy || !form.isDirty}
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-6 text-sm font-semibold text-white disabled:opacity-40 sm:w-auto"
                    >
                        {busy && <Loader2 size={16} className="animate-spin" />}
                        {preparing
                            ? t('Preparando fotos…')
                            : form.processing
                              ? t('Guardando…')
                              : t('Guardar perfil profesional')}
                    </NativeButton>
                </div>
            </form>
        </section>
    );
}
