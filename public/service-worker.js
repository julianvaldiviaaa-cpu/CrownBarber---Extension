self.addEventListener('push', (event) => {
    if (!event.data) return;
    const notification = event.data.json();
    event.waitUntil((async () => {
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const details = [notification.message, `Cliente: ${notification.client_name ?? ''} · Barbero: ${notification.worker_name ?? ''}`, (notification.services ?? []).join(', '), `${notification.total_duration} min · $${notification.total_price} MXN`].filter(Boolean).join('\n');
        await self.registration.showNotification(notification.title ?? 'CrownBarber', {
            body: details,
            tag: notification.id,
            data: { url: notification.url },
            silent: windows.some((window) => window.visibilityState === 'visible'),
        });
    })());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil((async () => {
        const url = new URL(event.notification.data.url, self.location.origin);
        if (url.origin !== self.location.origin) return;
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const window = windows[0];
        if (window) {
            await window.navigate(url.href);
            await window.focus();
        } else {
            await self.clients.openWindow(url.href);
        }
    })());
});
