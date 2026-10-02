import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { notifications as savePreferences } from '@/actions/App/Http/Controllers/ProfileController';
import {
    store,
    destroy,
} from '@/actions/App/Http/Controllers/PushSubscriptionsController';
import { NativeButton, NativeInput } from '@/Components/Watermelon';
import { useTranslation, translateCurrent } from '@/lib/i18n';
import {
    playNotificationSound,
    unlockNotificationSound,
} from '@/lib/notification-sound';

async function saveSubscription(url: string, method: string, data?: unknown) {
    const token = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        ?.slice(11);
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': decodeURIComponent(token ?? ''),
        },
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
        throw new Error(
            translateCurrent(
                'No se pudo guardar la configuración. Inténtalo de nuevo.',
            ),
        );
    }
}

export default function NotificationSettings({
    onDone,
}: {
    onDone?: () => void;
}) {
    const { t } = useTranslation();

    const { auth } = usePage().props;
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const supported =
        typeof window !== 'undefined' &&
        window.isSecureContext &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
    const blocked = supported && Notification.permission === 'denied';

    async function enable() {
        unlockNotificationSound();
        setBusy(true);
        setMessage('');

        try {
            if (!supported || !auth?.pushPublicKey) {
                throw new Error(
                    t(
                        'Las notificaciones del navegador aún no están disponibles.',
                    ),
                );
            }

            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                throw new Error(
                    permission === 'denied'
                        ? t(
                              'Chrome bloqueó los avisos. Permítelos en la configuración de este sitio y vuelve a intentarlo.',
                          )
                        : t(
                              'No activaste los avisos. Puedes intentarlo cuando quieras.',
                          ),
                );
            }

            await navigator.serviceWorker.register('/service-worker.js');
            const registration = await navigator.serviceWorker.ready;
            const key = Uint8Array.from(
                atob(auth.pushPublicKey.replace(/-/g, '+').replace(/_/g, '/')),
                (character) => character.charCodeAt(0),
            );
            let subscription = await registration.pushManager.getSubscription();

            if (
                subscription?.options.applicationServerKey &&
                new Uint8Array(
                    subscription.options.applicationServerKey,
                ).toString() !== key.toString()
            ) {
                await subscription.unsubscribe();
                subscription = null;
            }

            subscription ??= await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: key,
            });
            await saveSubscription(store.url(), 'POST', subscription.toJSON());
            router.reload({ only: ['auth'], onSuccess: () => onDone?.() });
            setMessage(t('Notificaciones activadas en este navegador.'));
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : t('No se pudieron activar los avisos.'),
            );
        } finally {
            setBusy(false);
        }
    }

    async function disable() {
        setBusy(true);

        try {
            await saveSubscription(destroy.url(), 'DELETE');

            if (supported) {
                const registration =
                    await navigator.serviceWorker.getRegistration();
                await (
                    await registration?.pushManager.getSubscription()
                )?.unsubscribe();
            }

            router.reload({ only: ['auth'] });
            setMessage(t('Notificaciones desactivadas en este navegador.'));
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : t('No se pudieron desactivar los avisos.'),
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-black/60">
                {t(
                    'Recibe solicitudes, confirmaciones, cambios de hora y cancelaciones con los datos de tu cita, incluso con la web cerrada.',
                )}{' '}
            </p>
            <label className="flex items-center gap-3 text-sm font-medium">
                <NativeInput
                    type="checkbox"
                    checked={auth?.user.notification_sound ?? true}
                    onChange={(event) => {
                        unlockNotificationSound();
                        router.put(
                            savePreferences.url(),
                            { notification_sound: event.target.checked },
                            { preserveScroll: true },
                        );
                    }}
                />
                {t('Sonido de campanita con la web abierta')}{' '}
            </label>
            <NativeButton
                type="button"
                onClick={() => {
                    unlockNotificationSound();
                    window.setTimeout(playNotificationSound, 100);
                }}
                className="self-start text-sm underline"
            >
                {t('Probar sonido')}{' '}
            </NativeButton>
            {!supported && (
                <p className="text-sm text-black/60">
                    {t(
                        'Abre el sitio por HTTPS en un navegador compatible para activar los avisos.',
                    )}{' '}
                </p>
            )}
            {supported && !auth?.pushPublicKey && (
                <p className="text-sm text-black/60">
                    {t(
                        'Los avisos del navegador están pendientes de configuración en el servidor.',
                    )}{' '}
                </p>
            )}
            {blocked && (
                <p className="text-sm text-black/60">
                    {t(
                        'Los avisos están bloqueados en los permisos de este sitio. Puedes permitirlos desde la configuración de Chrome.',
                    )}{' '}
                </p>
            )}
            <p className="text-sm">
                {t('Estado:')}{' '}
                {auth?.pushEnabled && !blocked
                    ? t('activadas en este navegador')
                    : t('desactivadas en este navegador')}
                .
            </p>
            <div className="flex flex-wrap gap-3">
                <NativeButton
                    type="button"
                    disabled={
                        busy || !supported || !auth?.pushPublicKey || blocked
                    }
                    onClick={() => void enable()}
                    className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                    {busy
                        ? t('Guardando…')
                        : auth?.pushEnabled
                          ? t('Reactivar avisos')
                          : t('Activar notificaciones')}
                </NativeButton>
                {auth?.pushEnabled && (
                    <NativeButton
                        type="button"
                        disabled={busy}
                        onClick={() => void disable()}
                        className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold"
                    >
                        {t('Desactivar en este navegador')}{' '}
                    </NativeButton>
                )}
            </div>
            {message && (
                <p role="status" className="text-sm">
                    {t(message)}
                </p>
            )}
        </div>
    );
}
