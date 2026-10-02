import { router, usePage } from '@inertiajs/react';
import { Bell, BellRing, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { NativeButton } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import type { NotificationItem } from '@/types';

export default function NotificationsBell() {
    const { t, intlLocale } = useTranslation();

    const { auth } = usePage().props;
    const notifications: NotificationItem[] = auth?.notifications ?? [];
    const unreadCount = auth?.unreadNotificationsCount ?? 0;

    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onPointerDown(e: MouseEvent) {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onPointerDown);

        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    const handleNotificationClick = (notification: NotificationItem) => {
        setOpen(false);
        router.visit(notification.data.url);
    };

    const markAllRead = () => {
        router.post(route('notifications.read'));
    };

    return (
        <div className="relative" ref={panelRef}>
            <NativeButton
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={t('Notificaciones')}
                aria-expanded={open}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-black/70 transition-colors duration-150 hover:bg-black/5 hover:text-black"
            >
                {unreadCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </NativeButton>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <p className="text-sm font-bold tracking-tight text-black">
                            {t('Notificaciones')}{' '}
                        </p>
                        {unreadCount > 0 && (
                            <NativeButton
                                type="button"
                                onClick={markAllRead}
                                className="flex items-center gap-1 text-xs font-semibold text-black/50 transition-colors hover:text-black"
                            >
                                <CheckCheck size={14} />
                                {t('Marcar leídas')}{' '}
                            </NativeButton>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 && (
                            <p className="px-4 py-8 text-center text-sm text-black/40">
                                {t('No tienes notificaciones.')}{' '}
                            </p>
                        )}

                        {notifications.map((notification) => (
                            <NativeButton
                                key={notification.id}
                                type="button"
                                onClick={() =>
                                    handleNotificationClick(notification)
                                }
                                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-gray-50 ${
                                    !notification.read_at ? 'bg-blue-50/50' : ''
                                }`}
                            >
                                <span
                                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                        notification.read_at
                                            ? 'bg-gray-200'
                                            : 'bg-blue-600'
                                    }`}
                                />
                                <span className="min-w-0">
                                    <span className="block text-sm font-medium tracking-tight text-black">
                                        {t(notification.data.message)}
                                    </span>
                                    {notification.data.client_name && (
                                        <span className="mt-1 block text-xs text-black/60">
                                            {notification.data.client_name} ·{' '}
                                            {notification.data.worker_name}
                                        </span>
                                    )}
                                    {!!notification.data.services?.length && (
                                        <span className="block text-xs text-black/60">
                                            {notification.data.services.join(
                                                ', ',
                                            )}{' '}
                                            · ${notification.data.total_price}{' '}
                                            {t('MXN ·')}{' '}
                                            {notification.data.total_duration}{' '}
                                            {t('min')}{' '}
                                        </span>
                                    )}
                                    <span className="mt-0.5 block text-xs text-black/40">
                                        {new Date(
                                            notification.created_at,
                                        ).toLocaleString(intlLocale)}
                                    </span>
                                </span>
                            </NativeButton>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
