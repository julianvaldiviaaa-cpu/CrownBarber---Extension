import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { initializeLanguage } from '@/lib/i18n';
import { createSmoothScroll } from '@/lib/smooth-scroll';

export default function ApplicationRuntime({
    children,
}: {
    children: ReactNode;
}) {
    useEffect(() => {
        const stopLanguage = initializeLanguage();
        const stopScroll = createSmoothScroll();
        let frame = 0;
        const sync = () => window.dispatchEvent(new Event('crown:scroll-sync'));
        const removeStart = router.on('start', sync);
        const removeFinish = router.on('finish', () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(sync);
        });

        return () => {
            cancelAnimationFrame(frame);
            removeStart();
            removeFinish();
            stopScroll();
            stopLanguage();
        };
    }, []);

    return children;
}
