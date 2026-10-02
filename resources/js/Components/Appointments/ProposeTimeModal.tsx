import { Modal, useOverlayState } from '@heroui/react';
import { router } from '@inertiajs/react';
import { CalendarClock, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { Button, NativeButton, NativeInput } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import { cn, formatSlotTime, toISODate } from '@/lib/utils';
import type { Appointment } from '@/types';

type Props = {
    appointment: Appointment;
    compact?: boolean;
};

export default function ProposeTimeModal({
    appointment,
    compact = false,
}: Props) {
    const { t } = useTranslation();

    const state = useOverlayState();
    const [date, setDate] = useState('');
    const [slots, setSlots] = useState<string[]>([]);
    const [time, setTime] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const serviceIds = (appointment.services ?? []).map(
        (service) => service.id,
    );

    const openModal = () => {
        setDate('');
        setSlots([]);
        setTime(null);
        setError(null);
        state.open();
    };

    const loadSlots = async (selectedDate: string) => {
        setDate(selectedDate);
        setTime(null);
        setError(null);

        if (!selectedDate || serviceIds.length === 0) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                route('appointments.availability', {
                    date: selectedDate,
                    worker_id: appointment.worker_id,
                    services: serviceIds,
                }),
            );
            const payload = await response.json();
            setSlots(payload.slots ?? []);
        } catch {
            setSlots([]);
            setError(t('No se pudo consultar la disponibilidad.'));
        } finally {
            setLoading(false);
        }
    };

    const submit = () => {
        if (!date || !time) {
            return;
        }

        router.post(
            route('appointments.propose', appointment),
            { starts_at: `${date} ${time}` },
            { preserveScroll: true, onSuccess: () => state.close() },
        );
    };

    const today = toISODate(new Date());

    return (
        <>
            <Button
                onPress={openModal}
                aria-label={t('Proponer nueva hora')}
                className={cn(
                    compact
                        ? 'flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 p-0 text-blue-700 transition-colors hover:bg-blue-100'
                        : 'flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold tracking-tight text-blue-700 transition-colors duration-150 hover:bg-blue-50',
                )}
            >
                <CalendarClock size={15} />
                {!compact && t('Proponer hora')}
            </Button>

            <Modal state={state}>
                <Modal.Backdrop>
                    <Modal.Container size="md">
                        <Modal.Dialog className="wm-overlay">
                            <Modal.CloseTrigger />
                            <Modal.Header>
                                <Modal.Icon>
                                    <CalendarClock />
                                </Modal.Icon>
                                <Modal.Heading>
                                    {t('Proponer una nueva hora')}{' '}
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                <p className="text-sm text-black/60">
                                    {t(
                                        'Elige el día y una hora disponible para el barbero. La otra parte podrá confirmarla, rechazarla o proponer otra.',
                                    )}{' '}
                                </p>

                                <div className="mt-4">
                                    <label className="text-sm font-semibold tracking-tight text-black">
                                        {t('Día')}{' '}
                                    </label>
                                    <NativeInput
                                        type="date"
                                        min={today}
                                        value={date}
                                        onChange={(e) =>
                                            loadSlots(e.target.value)
                                        }
                                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
                                    />
                                </div>

                                {loading && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-black/50">
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                        {t('Consultando disponibilidad…')}{' '}
                                    </div>
                                )}

                                {!loading && date && slots.length > 0 && (
                                    <div className="mt-4">
                                        <label className="text-sm font-semibold tracking-tight text-black">
                                            {t('Hora')}{' '}
                                        </label>
                                        <div className="mt-2 grid grid-cols-3 gap-2">
                                            {slots.map((slot) => (
                                                <NativeButton
                                                    key={slot}
                                                    type="button"
                                                    onClick={() =>
                                                        setTime(slot)
                                                    }
                                                    className={cn(
                                                        'rounded-lg border px-3 py-2 text-sm font-semibold tracking-tight transition-colors duration-150',
                                                        time === slot
                                                            ? 'border-black bg-black text-white'
                                                            : 'border-gray-200 text-black/60 hover:border-black hover:text-black',
                                                    )}
                                                >
                                                    {formatSlotTime(slot)}
                                                </NativeButton>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!loading && date && slots.length === 0 && (
                                    <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                        {t(
                                            'No hay horas disponibles para ese día.',
                                        )}{' '}
                                    </p>
                                )}

                                {error && (
                                    <p className="mt-4 text-sm text-red-600">
                                        {t(error)}
                                    </p>
                                )}
                            </Modal.Body>
                            <Modal.Footer className="flex items-center justify-center gap-3">
                                <Button
                                    slot="close"
                                    className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-semibold tracking-tight text-black/70"
                                >
                                    {t('Cancelar')}{' '}
                                </Button>
                                <Button
                                    onPress={submit}
                                    isDisabled={!date || !time}
                                    className="flex-1 rounded-full bg-black py-2.5 text-sm font-semibold tracking-tight text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {t('Proponer hora')}{' '}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    );
}
