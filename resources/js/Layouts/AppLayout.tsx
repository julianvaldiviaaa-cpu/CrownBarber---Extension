import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import '../../css/watermelon.css';
import AppNavigation from '@/Components/AppNavigation';
import FlashMessages from '@/Components/FlashMessages';
import Navbar from '@/Components/Navbar';
import NotificationRuntime from '@/Components/Notifications/NotificationRuntime';
import { Reveal } from '@/Components/Watermelon';

type Props = {
    children: ReactNode;
    navbar: 'dashboard' | 'guest';
};

export default function AppLayout({ children, navbar }: Props) {
    const { component } = usePage();

    return (
        <div className="wm-app">
            <FlashMessages />
            <NotificationRuntime />
            <Navbar navbar={navbar} />
            {navbar === 'dashboard' && <AppNavigation />}
            <main className="px-4 py-6 sm:p-8">
                <Reveal key={component}>{children}</Reveal>
            </main>
        </div>
    );
}
