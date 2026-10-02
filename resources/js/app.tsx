import { createInertiaApp } from '@inertiajs/react';
import ApplicationRuntime from '@/Components/ApplicationRuntime';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    withApp: (app) => <ApplicationRuntime>{app}</ApplicationRuntime>,
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#4B5563',
    },
});
