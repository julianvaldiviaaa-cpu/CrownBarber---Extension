import { Button, Modal } from '@heroui/react';
import { router, usePage, usePoll } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { notifications as savePreferences } from '@/actions/App/Http/Controllers/ProfileController';
import NotificationSettings from '@/Components/Notifications/NotificationSettings';
import { useTranslation } from '@/lib/i18n';
import {
    playNotificationSound,
    unlockNotificationSound,
} from '@/lib/notification-sound';
import { POLL_INTERVAL_MS } from '@/lib/utils';

const seenByUser = new Map<number, Set<string>>();

export default function NotificationRuntime() {
    const { auth } = usePage().props;

    return auth?.user ? (
        <AuthenticatedNotifications key={auth.user.id} />
    ) : null;
}

function AuthenticatedNotifications() {
    const { t } = useTranslation();

    const { auth } = usePage().props;
    const [dismissed, setDismissed] = useState(false);
    usePoll(POLL_INTERVAL_MS, { only: ['auth'] });

    useEffect(() => {
        document.addEventListener('pointerdown', unlockNotificationSound);
        document.addEventListener('keydown', unlockNotificationSound);

        return () => {
            document.removeEventListener(
                'pointerdown',
                unlockNotificationSound,
            );
            document.removeEventListener('keydown', unlockNotificationSound);
        };
    }, []);

    useEffect(() => {
        if (!auth?.user) {
            return;
        }

        const userId = auth.user.id;
        const notifications = auth.notifications ?? [];
        const previous = seenByUser.get(userId);
        const seen = previous ?? new Set<string>();
        const fresh = previous
            ? notifications.filter(
                  (notification) =>
                      !seen.has(notification.id) && !notification.read_at,
              )
            : [];
        notifications.forEach((notification) => seen.add(notification.id));
        seenByUser.set(userId, seen);

        if (fresh.length && auth.user.notification_sound) {
            const ring = () => {
                try {
                    const key = `crown-notification-${userId}`;
                    const last = localStorage.getItem(key);

                    if (last === fresh[0].id) {
                        return;
                    }

                    if (playNotificationSound()) {
                        localStorage.setItem(key, fresh[0].id);
                    }
                } catch {
                    playNotificationSound();
                }
            };

            if (navigator.locks) {
                void navigator.locks.request('crown-notification-sound', ring);
            } else {
                ring();
            }
        }
    }, [auth]);

    const close = () => {
        setDismissed(true);
        router.put(
            savePreferences.url(),
            { prompt_dismissed: true },
            { preserveScroll: true },
        );
    };

    return (
        <Modal
            isOpen={!dismissed && !auth?.user.notification_prompted_at}
            onOpenChange={(open) => {
                if (!open) {
                    close();
                }
            }}
        >
            <Modal.Backdrop>
                <Modal.Container size="sm">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>
                                {t(
                                    '¿Activar notificaciones de tus citas?',
                                )}{' '}
                            </Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <NotificationSettings
                                onDone={() => setDismissed(true)}
                            />
                        </Modal.Body>
                        <Modal.Footer>
                            <Button onPress={close}>{t('Ahora no')}</Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
