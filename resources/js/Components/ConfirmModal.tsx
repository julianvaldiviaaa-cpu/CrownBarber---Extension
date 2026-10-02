import { Modal, useOverlayState } from '@heroui/react';
import type { ReactNode } from 'react';
import { Button } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Props = {
    heading: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    /** Estado externo para abrir el modal sin botón trigger propio. */
    state?: ReturnType<typeof useOverlayState>;
    triggerChildren?: ReactNode;
    triggerClassName?: string;
    triggerAriaLabel?: string;
};

export default function ConfirmModal({
    heading,
    message,
    confirmLabel,
    cancelLabel,
    danger = true,
    onConfirm,
    state: externalState,
    triggerChildren,
    triggerClassName,
    triggerAriaLabel,
}: Props) {
    const { t } = useTranslation();

    const internalState = useOverlayState();
    const state = externalState ?? internalState;

    const handleConfirm = () => {
        state.close();
        onConfirm();
    };

    return (
        <>
            {!externalState && (
                <Button
                    onPress={() => state.open()}
                    aria-label={triggerAriaLabel}
                    className={triggerClassName}
                >
                    {triggerChildren}
                </Button>
            )}

            <Modal state={state}>
                <Modal.Backdrop>
                    <Modal.Container size="sm">
                        <Modal.Dialog className="wm-overlay">
                            <Modal.CloseTrigger />
                            <Modal.Header>
                                <Modal.Heading>{heading}</Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                <p className="text-sm text-black/60">
                                    {message}
                                </p>
                            </Modal.Body>
                            <Modal.Footer className="flex items-center justify-center gap-3">
                                <Button
                                    slot="close"
                                    className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-semibold tracking-tight text-black/70"
                                >
                                    {cancelLabel ?? t('Cancelar')}
                                </Button>
                                <Button
                                    onPress={handleConfirm}
                                    className={cn(
                                        'flex-1 rounded-full py-2.5 text-sm font-semibold tracking-tight text-white',
                                        danger
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-black',
                                    )}
                                >
                                    {confirmLabel ?? t('Confirmar')}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    );
}
