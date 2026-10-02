import { router, useForm, useHttp } from '@inertiajs/react';
import { ArrowLeft, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import ConfirmModal from '@/Components/ConfirmModal';
import { NativeButton, NativeInput, Card } from '@/Components/Watermelon';
import AppLayout from '@/Layouts/AppLayout';
import { useTranslation } from '@/lib/i18n';
import { cn, parseDateOnly, toISODate } from '@/lib/utils';
import { dashboard } from '@/routes';
import { store, update } from '@/routes/business-hours';
import {
    store as storeOverride,
    update as updateOverride,
    destroy as destroyOverride,
} from '@/routes/business-hours/overrides';
import type { BusinessHour, BusinessHourOverride } from '@/types';

type WeekDay = { value: number; label: string };

type Props = {
    weekly: BusinessHour[];
    overrides: BusinessHourOverride[];
    weekDays: WeekDay[];
};

function useScheduleAutosave(data: object, save: () => Promise<unknown>) {
    const { t } = useTranslation();

    const snapshot = JSON.stringify(data);
    const [saved, setSaved] = useState(snapshot);
    const [attempted, setAttempted] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [failed, setFailed] = useState(false);
    const performSave = useEffectEvent(save);

    useEffect(() => {
        if (snapshot === saved || snapshot === attempted || saving) {
            return;
        }

        const timer = window.setTimeout(() => {
            setSaving(true);
            setFailed(false);
            setAttempted(snapshot);
            void performSave()
                .then(() => setSaved(snapshot))
                .catch(() => setFailed(true))
                .finally(() => setSaving(false));
        }, 700);

        return () => window.clearTimeout(timer);
    }, [snapshot, saved, attempted, saving]);

    const pending = snapshot !== saved;

    useEffect(() => {
        if (!pending && !saving) {
            return;
        }

        const beforeUnload = (event: BeforeUnloadEvent) =>
            event.preventDefault();
        const removeListener = router.on('before', () =>
            window.confirm(
                t('Hay cambios sin guardar. ¿Quieres salir de todos modos?'),
            ),
        );
        window.addEventListener('beforeunload', beforeUnload);

        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
            removeListener();
        };
    }, [pending, saving, t]);

    return { saving, pending, failed, retry: () => setAttempted(null) };
}

function SaveStatus({
    status,
}: {
    status: ReturnType<typeof useScheduleAutosave>;
}) {
    const { t } = useTranslation();

    return (
        <div aria-live="polite" className="text-sm text-black/60">
            {status.failed ? (
                <span className="text-red-700">
                    {t('No se guardó.')}{' '}
                    <NativeButton
                        type="button"
                        onClick={status.retry}
                        className="min-h-11 font-bold underline"
                    >
                        {t('Reintentar')}{' '}
                    </NativeButton>
                </span>
            ) : status.saving || status.pending ? (
                <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />{' '}
                    {t('Guardando…')}{' '}
                </span>
            ) : (
                t('Guardado automáticamente')
            )}
        </div>
    );
}

function DayRow({ day, hours }: { day: WeekDay; hours?: BusinessHour }) {
    const { t } = useTranslation();

    const { data, setData, post, put, response, errors } = useHttp<
        {
            day_of_week: number;
            open_time: string;
            close_time: string;
            active: boolean;
        },
        BusinessHour
    >({
        day_of_week: day.value,
        open_time: hours?.open_time ?? '10:00',
        close_time: hours?.close_time ?? '20:00',
        active: hours?.active ?? false,
    });

    const isActive = data.active;
    const status = useScheduleAutosave(data, () => {
        const id = response?.id ?? hours?.id;

        return id ? put(update.url(id)) : post(store.url());
    });

    return (
        <form
            onSubmit={(event) => event.preventDefault()}
            className={cn(
                'flex flex-col gap-4 rounded-2xl border p-4 transition-colors duration-200 sm:p-5 lg:flex-row lg:flex-wrap lg:items-center',
                isActive
                    ? 'border-black/20 bg-white'
                    : 'border-gray-200 bg-gray-50/50',
            )}
        >
            <div className="flex items-center gap-3 sm:w-40">
                <NativeButton
                    type="button"
                    onClick={() => setData('active', !isActive)}
                    title={isActive ? t('Día abierto') : t('Día cerrado')}
                    role="switch"
                    aria-checked={isActive}
                    aria-label={t('Abrir {day}', { day: t(day.label) })}
                    className={cn(
                        'flex h-11 w-16 shrink-0 items-center rounded-full p-2 transition-colors duration-200',
                        isActive ? 'bg-black' : 'bg-gray-300',
                    )}
                >
                    <span
                        className={cn(
                            'h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                            isActive && 'translate-x-5',
                        )}
                    />
                </NativeButton>
                <span
                    className={cn(
                        'text-lg font-bold tracking-tight',
                        isActive ? 'text-black' : 'text-black/40',
                    )}
                >
                    {t(day.label)}
                </span>
            </div>

            <div className="flex flex-1 items-center gap-2">
                <NativeInput
                    type="time"
                    aria-label={t('Apertura del {day}', { day: t(day.label) })}
                    value={data.open_time}
                    onChange={(e) => setData('open_time', e.target.value)}
                    disabled={!isActive}
                    className="min-h-12 w-full min-w-0 rounded-xl border border-gray-200 px-3 py-3 text-base font-medium text-black outline-none focus:border-black disabled:opacity-40 sm:max-w-40"
                />
                <span className="text-black/30">—</span>
                <NativeInput
                    type="time"
                    aria-label={t('Cierre del {day}', { day: t(day.label) })}
                    value={data.close_time}
                    onChange={(e) => setData('close_time', e.target.value)}
                    disabled={!isActive}
                    className="min-h-12 w-full min-w-0 rounded-xl border border-gray-200 px-3 py-3 text-base font-medium text-black outline-none focus:border-black disabled:opacity-40 sm:max-w-40"
                />
            </div>

            <SaveStatus status={status} />
            {errors.open_time && (
                <p role="alert" className="text-red-600">
                    {t(errors.open_time)}
                </p>
            )}
            {errors.close_time && (
                <p role="alert" className="text-red-600">
                    {t(errors.close_time)}
                </p>
            )}

            {errors.day_of_week && (
                <p className="text-sm font-medium text-red-600">
                    {t(errors.day_of_week)}
                </p>
            )}
        </form>
    );
}

function OverrideForm({ onDone }: { onDone: () => void }) {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        date: '',
        open_time: '10:00',
        close_time: '20:00',
        is_closed: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(storeOverride.url(), {
            preserveScroll: true,
            onSuccess: () => onDone(),
        });
    };

    return (
        <form
            onSubmit={submit}
            className="flex flex-col gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-5"
        >
            <p className="text-sm font-semibold tracking-tight text-black">
                {t('Nueva excepción por fecha')}{' '}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                        {t('Fecha')}{' '}
                    </span>
                    <NativeInput
                        type="date"
                        min={toISODate(new Date())}
                        value={data.date}
                        onChange={(e) => {
                            setData('date', e.target.value);

                            if (errors.date) {
                                clearErrors('date');
                            }
                        }}
                        className="min-h-12 min-w-0 rounded-xl border border-gray-200 px-3 py-3 text-base font-medium text-black outline-none focus:border-black"
                    />
                </label>
                <div className="flex items-end gap-2">
                    <label className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                            {t('Apertura')}{' '}
                        </span>
                        <NativeInput
                            type="time"
                            value={data.open_time}
                            onChange={(e) =>
                                setData('open_time', e.target.value)
                            }
                            disabled={data.is_closed}
                            className="min-h-12 w-full min-w-0 rounded-xl border border-gray-200 px-3 py-3 text-base font-medium text-black outline-none focus:border-black disabled:opacity-40"
                        />
                    </label>
                    <span className="pb-2 text-black/30">—</span>
                    <label className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                            {t('Cierre')}{' '}
                        </span>
                        <NativeInput
                            type="time"
                            value={data.close_time}
                            onChange={(e) =>
                                setData('close_time', e.target.value)
                            }
                            disabled={data.is_closed}
                            className="min-h-12 w-full min-w-0 rounded-xl border border-gray-200 px-3 py-3 text-base font-medium text-black outline-none focus:border-black disabled:opacity-40"
                        />
                    </label>
                </div>
                <label className="flex items-center gap-2 sm:col-span-2">
                    <NativeButton
                        type="button"
                        onClick={() => setData('is_closed', !data.is_closed)}
                        role="switch"
                        aria-label={t('Cerrar todo el día')}
                        aria-checked={data.is_closed}
                        className={cn(
                            'flex h-11 w-16 shrink-0 items-center rounded-full p-2 transition-colors duration-200',
                            data.is_closed ? 'bg-red-500' : 'bg-gray-300',
                        )}
                    >
                        <span
                            className={cn(
                                'h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                                data.is_closed && 'translate-x-5',
                            )}
                        />
                    </NativeButton>
                    <span className="text-sm font-medium text-black/60">
                        {t('Cerrado todo el día')}{' '}
                    </span>
                </label>
            </div>
            {Object.entries(errors).map(([key, error]) => (
                <p
                    key={key}
                    role="alert"
                    className="text-base font-medium text-red-600"
                >
                    {t(error)}
                </p>
            ))}
            <NativeButton
                type="submit"
                disabled={processing}
                className="flex items-center justify-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-sm font-semibold tracking-tight text-white transition-transform active:scale-[0.97] disabled:opacity-50"
            >
                {processing ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : (
                    <Plus size={14} />
                )}
                {t('Agregar excepción')}{' '}
            </NativeButton>
        </form>
    );
}

function OverrideRow({ override }: { override: BusinessHourOverride }) {
    const { t, intlLocale } = useTranslation();

    const { data, setData, put, errors } = useHttp({
        date: override.date,
        open_time: override.open_time?.slice(0, 5) ?? '10:00',
        close_time: override.close_time?.slice(0, 5) ?? '20:00',
        is_closed: override.is_closed,
    });
    const status = useScheduleAutosave(data, () =>
        put(updateOverride.url(override)),
    );
    const dateLabel = parseDateOnly(override.date).toLocaleDateString(
        intlLocale,
        {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        },
    );

    return (
        <Card className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5">
            <div>
                <p className="text-lg font-bold tracking-tight text-black capitalize">
                    {dateLabel}
                </p>
                <p className="text-sm text-black/50">
                    {data.is_closed ? (
                        <span className="font-semibold text-red-600">
                            {t('Cerrado todo el día')}{' '}
                        </span>
                    ) : (
                        <>
                            {t('Abierto de')}{' '}
                            <strong className="text-black">
                                {data.open_time}
                            </strong>{' '}
                            {t('a')}{' '}
                            <strong className="text-black">
                                {data.close_time}
                            </strong>
                        </>
                    )}
                </p>
            </div>
            <label className="flex min-h-11 items-center gap-3 text-base font-medium">
                <NativeInput
                    type="checkbox"
                    checked={data.is_closed}
                    onChange={(event) =>
                        setData('is_closed', event.target.checked)
                    }
                    className="size-6 accent-black"
                />{' '}
                {t('Cerrado todo el día')}{' '}
            </label>
            <div className="grid grid-cols-2 gap-3">
                <label className="min-w-0 text-sm font-semibold">
                    {t('Apertura')}{' '}
                    <NativeInput
                        type="time"
                        value={data.open_time}
                        disabled={data.is_closed}
                        onChange={(event) =>
                            setData('open_time', event.target.value)
                        }
                        className="mt-1 min-h-12 w-full min-w-0 rounded-xl border border-gray-200 p-3 text-base disabled:opacity-40"
                    />
                </label>
                <label className="min-w-0 text-sm font-semibold">
                    {t('Cierre')}{' '}
                    <NativeInput
                        type="time"
                        value={data.close_time}
                        disabled={data.is_closed}
                        onChange={(event) =>
                            setData('close_time', event.target.value)
                        }
                        className="mt-1 min-h-12 w-full min-w-0 rounded-xl border border-gray-200 p-3 text-base disabled:opacity-40"
                    />
                </label>
            </div>
            {Object.entries(errors).map(([key, error]) => (
                <p key={key} role="alert" className="text-red-600">
                    {t(error)}
                </p>
            ))}
            <SaveStatus status={status} />

            <ConfirmModal
                heading={t('¿Eliminar la excepción del {date}?', {
                    date: dateLabel,
                })}
                message={t('Ese día volverá a usar el horario semanal.')}
                confirmLabel={t('Sí, eliminar')}
                onConfirm={() =>
                    router.delete(destroyOverride.url(override), {
                        preserveScroll: true,
                    })
                }
                triggerClassName="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-50"
                triggerChildren={
                    <>
                        <Trash2 size={14} />
                        {t('Eliminar')}{' '}
                    </>
                }
            />
        </Card>
    );
}

export default function BusinessHours({ weekly, overrides, weekDays }: Props) {
    const { t } = useTranslation();

    const [showOverrideForm, setShowOverrideForm] = useState(false);

    return (
        <AppLayout navbar="dashboard">
            <div className="mx-auto max-w-5xl py-5 sm:px-6 md:py-12">
                <NativeButton
                    type="button"
                    onClick={() => router.get(dashboard.url())}
                    className="inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.15em] text-black/40 uppercase transition-colors duration-150 hover:text-black"
                >
                    <ArrowLeft size={12} />
                    {t('Dashboard')}{' '}
                </NativeButton>

                <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-black sm:text-5xl">
                            {t('Horarios de apertura')}{' '}
                        </h1>
                        <p className="mt-2 text-sm font-medium tracking-tight text-black/40">
                            {t(
                                'Los clientes solo podrán agendar dentro de estos horarios. Los cambios se guardan automáticamente.',
                            )}{' '}
                        </p>
                    </div>
                </div>

                {/* Horario semanal */}
                <section className="mt-10">
                    <h2 className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                        {t('Horario semanal')}{' '}
                    </h2>
                    <div className="mt-4 flex flex-col gap-3">
                        {weekDays.map((day) => (
                            <DayRow
                                key={day.value}
                                day={day}
                                hours={weekly.find(
                                    (h) => h.day_of_week === day.value,
                                )}
                            />
                        ))}
                    </div>
                </section>

                {/* Excepciones */}
                <section className="mt-14">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                                {t('Excepciones por fecha')}{' '}
                            </h2>
                            <p className="mt-1 text-sm text-black/45">
                                {t(
                                    'Cierres, festivos u horarios especiales para días concretos.',
                                )}{' '}
                            </p>
                        </div>
                        <NativeButton
                            type="button"
                            onClick={() => setShowOverrideForm((v) => !v)}
                            className="flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-sm font-semibold tracking-tight text-white transition-transform active:scale-[0.97]"
                        >
                            {showOverrideForm ? (
                                <X size={14} />
                            ) : (
                                <Plus size={14} />
                            )}
                            {showOverrideForm
                                ? t('Cancelar')
                                : t('Nueva excepción')}
                        </NativeButton>
                    </div>

                    {showOverrideForm && (
                        <div className="mt-4">
                            <OverrideForm
                                onDone={() => setShowOverrideForm(false)}
                            />
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3">
                        {overrides.length === 0 && (
                            <p className="text-sm text-black/40">
                                {t('No hay excepciones registradas.')}{' '}
                            </p>
                        )}
                        {overrides.map((override) => (
                            <OverrideRow
                                key={override.id}
                                override={override}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
