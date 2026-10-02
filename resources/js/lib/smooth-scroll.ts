import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/** Una sola instancia para todo el documento, incluidos los cambios de página de Inertia. */
export function createSmoothScroll(): () => void {
    gsap.registerPlugin(ScrollTrigger);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | undefined;

    const tick = (time: number) => lenis?.raf(time * 1000);
    const updateLock = () => {
        const locked =
            ['hidden', 'clip'].includes(
                getComputedStyle(document.body).overflowY,
            ) ||
            ['hidden', 'clip'].includes(
                document.documentElement.style.overflowY ||
                    document.documentElement.style.overflow,
            );

        if (locked) {
            lenis?.stop();
        } else {
            lenis?.start();
        }
    };
    const observer = new MutationObserver(updateLock);
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style', 'class'],
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style'],
    });

    const configure = () => {
        lenis?.destroy();
        lenis = undefined;

        if (!media.matches) {
            lenis = new Lenis({
                lerp: 0.085,
                smoothWheel: true,
                syncTouch: false,
                anchors: { offset: -100 },
                allowNestedScroll: true,
                prevent: (node) =>
                    node.hasAttribute('data-lenis-prevent') ||
                    node.getAttribute('role') === 'dialog',
            });
            lenis.on('scroll', ScrollTrigger.update);
            updateLock();
        }
    };
    const synchronize = () => {
        lenis?.resize();
        lenis?.scrollTo(window.scrollY, { immediate: true });
    };
    const onFocus = (event: FocusEvent) => {
        if (
            event.target instanceof HTMLElement &&
            event.target.matches(':focus-visible')
        ) {
            synchronize();
        }
    };

    configure();
    gsap.ticker.add(tick);
    media.addEventListener('change', configure);
    window.addEventListener('crown:scroll-sync', synchronize);
    document.addEventListener('focusin', onFocus);

    return () => {
        observer.disconnect();
        media.removeEventListener('change', configure);
        window.removeEventListener('crown:scroll-sync', synchronize);
        document.removeEventListener('focusin', onFocus);
        gsap.ticker.remove(tick);
        lenis?.destroy();
    };
}
