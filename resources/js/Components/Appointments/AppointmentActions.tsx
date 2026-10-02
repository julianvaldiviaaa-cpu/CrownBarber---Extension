import { router, usePage } from '@inertiajs/react';
import { Ban, Check, X } from 'lucide-react';
import { route } from 'ziggy-js';
import ProposeTimeModal from '@/Components/Appointments/ProposeTimeModal';
import ConfirmModal from '@/Components/ConfirmModal';
import { NativeButton } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import type { Appointment } from '@/types';

type Props = {
    appointment: Appointment;
    /** Vista compacta: solo botones, sin estados de texto. */
    compact?: boolean;
};

/**
 * Botones de acción sobre una cita según el rol y el estado, replicando
 * exactamente las reglas de AppointmentPolicy.
 */
export default function AppointmentActions({
    appointment,
    compact = false,
}: Props) {
    const { t } = useTranslation();

    const { auth } = usePage().props;
    const user = auth?.user;

    if (!user) {
        return null;
    }

    const isWorker = user.id === appointment.worker_id;
    const isUser = user.id === appointment.user_id;
    const canAct = isWorker || isUser;

    const status = appointment.status;
    const proposedByOther =
        appointment.proposed_by !== null && appointment.proposed_by !== user.id;

    // Estado "pending": solo el barbero responde.
    // Estado "proposed": responde quien NO propuso.
    const canRespond =
        canAct &&
        (status === 'pending'
            ? isWorker
            : status === 'proposed'
              ? proposedByOther
              : false);

    // Cualquiera de las partes cancela una cita confirmada futura.
    const canCancel =
        canAct &&
        status === 'confirmed' &&
        new Date(appointment.starts_at) > new Date();

    if (!canRespond && !canCancel) {
        return null;
    }

    const confirm = () =>
        router.post(
            route('appointments.confirm', appointment),
            {},
            { preserveScroll: true },
        );
    const reject = () =>
        router.post(
            route('appointments.reject', appointment),
            {},
            { preserveScroll: true },
        );
    const cancel = () =>
        router.post(
            route('appointments.cancel', appointment),
            {},
            { preserveScroll: true },
        );

    const buttonClass = compact
        ? 'flex h-9 w-9 items-center justify-center rounded-full'
        : 'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold tracking-tight';

    const destructiveTriggerClass = `${buttonClass} border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100`;

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {canRespond && (
                <>
                    <NativeButton
                        type="button"
                        onClick={confirm}
                        title={t('Confirmar cita')}
                        className={`${buttonClass} border border-green-200 bg-green-50 text-green-700 transition-colors hover:bg-green-100`}
                    >
                        <Check size={15} />
                        {!compact && t('Confirmar')}
                    </NativeButton>
                    <ProposeTimeModal
                        appointment={appointment}
                        compact={compact}
                    />
                    <ConfirmModal
                        heading={t('¿Rechazar esta cita?')}
                        message={t(
                            'La cita quedará rechazada y la otra parte será notificada.',
                        )}
                        confirmLabel={t('Sí, rechazar')}
                        onConfirm={reject}
                        triggerAriaLabel={t('Rechazar cita')}
                        triggerClassName={destructiveTriggerClass}
                        triggerChildren={
                            <>
                                <X size={15} />
                                {!compact && t('Rechazar')}
                            </>
                        }
                    />
                </>
            )}

            {canCancel && (
                <ConfirmModal
                    heading={t('¿Cancelar esta cita?')}
                    message={t(
                        'La cita quedará cancelada y la otra parte será notificada.',
                    )}
                    confirmLabel={t('Sí, cancelar')}
                    onConfirm={cancel}
                    triggerAriaLabel={t('Cancelar cita')}
                    triggerClassName={destructiveTriggerClass}
                    triggerChildren={
                        <>
                            <Ban size={15} />
                            {!compact && t('Cancelar cita')}
                        </>
                    }
                />
            )}
        </div>
    );
}
