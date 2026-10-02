import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/** Owns the public page's scroll effects and restores the DOM on navigation. */
export function createPublicMotion(root: HTMLElement): () => void {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const media = gsap.matchMedia();
    const select = gsap.utils.selector(root);

    media.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
            const splits: SplitText[] = [];

            root.querySelectorAll<HTMLElement>('[data-split-intro]').forEach(
                (heading) => {
                    splits.push(
                        SplitText.create(heading, {
                            type: 'lines,words,chars',
                            mask: 'lines',
                            autoSplit: true,
                            aria: 'auto',
                            onSplit: (self) =>
                                gsap.from(self.chars, {
                                    yPercent: 110,
                                    rotation: 4,
                                    opacity: 0,
                                    duration: 1.2,
                                    stagger: 0.025,
                                    ease: 'power4.out',
                                }),
                        }),
                    );
                },
            );

            root.querySelectorAll<HTMLElement>(
                '.crown-section-heading h2, .crown-story h2, .crown-page-intro h1, .crown-footer h2',
            ).forEach((heading) => {
                splits.push(
                    SplitText.create(heading, {
                        type: 'lines,words',
                        autoSplit: true,
                        mask: 'lines',
                        aria: 'auto',
                        onSplit: (self) =>
                            gsap.from(self.words, {
                                yPercent: 105,
                                opacity: 0,
                                stagger: 0.05,
                                duration: 0.9,
                                ease: 'power3.out',
                                scrollTrigger: {
                                    trigger: heading,
                                    start: 'top 92%',
                                    once: true,
                                },
                            }),
                    }),
                );
            });

            root.querySelectorAll<HTMLElement>('.crown-reveal').forEach(
                (element) => {
                    gsap.from(element, {
                        y: 35,
                        opacity: 0,
                        duration: 0.9,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: element,
                            start: 'top 95%',
                            once: true,
                        },
                    });
                },
            );

            const hero = root.querySelector('.crown-cinematic');

            if (hero) {
                gsap.to(select('.crown-cinematic-photo'), {
                    yPercent: 15,
                    scale: 1.08,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: hero,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: 1,
                    },
                });
                gsap.to(select('.crown-cinematic-title'), {
                    yPercent: -16,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: hero,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: 0.8,
                    },
                });
            }

            const ritual = root.querySelector<HTMLElement>('.crown-ritual');
            const statement =
                root.querySelector<HTMLElement>('[data-split-scrub]');

            if (ritual && statement) {
                splits.push(
                    SplitText.create(statement, {
                        type: 'words',
                        aria: 'auto',
                        onSplit: (self) =>
                            gsap.from(self.words, {
                                opacity: 0.18,
                                stagger: 0.35,
                                ease: 'none',
                                scrollTrigger: {
                                    trigger: ritual,
                                    start: 'top 35%',
                                    end: 'bottom 65%',
                                    scrub: 0.8,
                                    invalidateOnRefresh: true,
                                },
                            }),
                    }),
                );
                gsap.fromTo(
                    select('.crown-ritual-line'),
                    { scaleX: 0 },
                    {
                        scaleX: 1,
                        transformOrigin: 'left center',
                        ease: 'none',
                        scrollTrigger: {
                            trigger: ritual,
                            start: 'top 35%',
                            end: 'bottom 65%',
                            scrub: 0.8,
                        },
                    },
                );
                gsap.to(select('.crown-ritual-emblem'), {
                    rotation: 45,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: ritual,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1.2,
                    },
                });
            }

            root.querySelectorAll<HTMLElement>('[data-parallax]').forEach(
                (frame) => {
                    const photo = frame.querySelector('img');

                    if (photo) {
                        gsap.fromTo(
                            photo,
                            { yPercent: -7, scale: 1.14 },
                            {
                                yPercent: 7,
                                ease: 'none',
                                scrollTrigger: {
                                    trigger: frame,
                                    start: 'top bottom',
                                    end: 'bottom top',
                                    scrub: 1,
                                },
                            },
                        );
                    }
                },
            );

            gsap.fromTo(
                select('.crown-scroll-progress'),
                { scaleX: 0 },
                {
                    scaleX: 1,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: root,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: true,
                    },
                },
            );

            return () => {
                splits.forEach((split) => split.revert());
            };
        },
        root,
    );

    media.add(
        '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
        () => {
            const ritual = root.querySelector('.crown-ritual');
            const stage = root.querySelector('.crown-ritual-stage');

            if (ritual && stage) {
                ScrollTrigger.create({
                    trigger: stage,
                    start: 'top 100px',
                    endTrigger: ritual,
                    end: 'bottom bottom',
                    pin: true,
                    pinSpacing: false,
                    invalidateOnRefresh: true,
                });
            }
        },
        root,
    );

    let disposed = false;
    let refreshFrame = 0;
    let previousHeight = root.offsetHeight;
    const refresh = () => {
        cancelAnimationFrame(refreshFrame);
        refreshFrame = requestAnimationFrame(() => {
            if (!disposed) {
                ScrollTrigger.refresh();
            }
        });
    };
    const observer = new ResizeObserver(() => {
        if (root.offsetHeight !== previousHeight) {
            previousHeight = root.offsetHeight;
            refresh();
        }
    });
    observer.observe(root);
    root.addEventListener('load', refresh, true);
    void document.fonts.ready.then(() => {
        if (!disposed) {
            refresh();
        }
    });
    refresh();

    return () => {
        disposed = true;
        observer.disconnect();
        root.removeEventListener('load', refresh, true);
        cancelAnimationFrame(refreshFrame);
        media.revert();
    };
}
