import type { ReactNode } from 'react';
import '../../css/watermelon.css';
import AppNavigation from '@/Components/AppNavigation';
import FlashMessages from '@/Components/FlashMessages';
import Navbar from '@/Components/Navbar';
import { Reveal } from '@/Components/Watermelon';

type Props = {
    children: ReactNode;
    navbar: 'dashboard' | 'guest';
};

export default function FormLayout({ children, navbar }: Props) {
    return (
        <div className="wm-app">
            <FlashMessages />
            <Navbar navbar={navbar} />
            {navbar === 'dashboard' && <AppNavigation />}
            <main className="mx-auto my-6 max-w-5xl px-4 sm:my-12 sm:px-6">
                <Reveal>{children}</Reveal>
            </main>
        </div>
    );
}
