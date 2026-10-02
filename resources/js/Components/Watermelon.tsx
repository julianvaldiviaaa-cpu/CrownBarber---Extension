/**
 * Adapted from Watermelon UI's MIT registry: animated-button, input, textarea,
 * card, badge, table, floating-input, discrete-tabs, progress, credit-usage-card.
 * https://github.com/WatermelonCorp/watermellon-registry
 * See Watermelon.LICENSE. HeroUI retains accessible form and overlay behavior;
 * CSS replaces Motion for these small interactions without adding dependencies.
 */
import { Button as HeroButton, Input as HeroInput } from '@heroui/react';
import { Link } from '@inertiajs/react';
import type { ComponentProps, CSSProperties } from 'react';
import { useId } from 'react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function Button({
    className,
    ...props
}: ComponentProps<typeof HeroButton>) {
    return (
        <HeroButton
            {...props}
            className={(state) =>
                cn(
                    'wm-button',
                    typeof className === 'function'
                        ? className(state)
                        : className,
                )
            }
        />
    );
}

export function AnimatedButton({
    className,
    type = 'button',
    ...props
}: ComponentProps<'button'>) {
    return (
        <button
            type={type}
            {...props}
            data-slot="button"
            className={cn(
                'wm-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50',
                className,
            )}
        />
    );
}

export function NativeButton({
    className,
    type = 'submit',
    ...props
}: ComponentProps<'button'>) {
    return (
        <button type={type} {...props} className={cn('wm-button', className)} />
    );
}

export function NativeInput({ className, ...props }: ComponentProps<'input'>) {
    return (
        <input
            data-slot="input"
            {...props}
            className={cn('wm-input', className)}
        />
    );
}

export function Input({
    className,
    ...props
}: ComponentProps<typeof HeroInput>) {
    return (
        <HeroInput
            {...props}
            className={(state) =>
                cn(
                    'wm-input',
                    typeof className === 'function'
                        ? className(state)
                        : className,
                )
            }
        />
    );
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            {...props}
            className={cn(
                'wm-input min-h-16 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-base disabled:opacity-50',
                className,
            )}
        />
    );
}

export function FloatingInput({
    label,
    className,
    id,
    ...props
}: ComponentProps<'input'> & { label: string }) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
        <div className="wm-floating relative">
            <input
                {...props}
                id={inputId}
                placeholder=" "
                className={cn(
                    'wm-input peer w-full rounded-xl border border-gray-200 bg-transparent px-4 pt-6 pb-2 text-base',
                    className,
                )}
            />
            <label
                htmlFor={inputId}
                className="pointer-events-none absolute top-2 left-4 text-xs text-current opacity-60 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs"
            >
                {label}
            </label>
        </div>
    );
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="card"
            {...props}
            className={cn(
                'wm-card flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 text-black shadow-sm',
                className,
            )}
        />
    );
}

export function Badge({ className, ...props }: ComponentProps<'span'>) {
    return (
        <span
            data-slot="badge"
            {...props}
            className={cn(
                'wm-badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                className,
            )}
        />
    );
}

export function Table({ className, ...props }: ComponentProps<'table'>) {
    return (
        <div
            data-slot="table-container"
            className="relative w-full overflow-x-auto"
        >
            <table
                data-slot="table"
                {...props}
                className={cn(
                    'wm-table w-full caption-bottom text-sm',
                    className,
                )}
            />
        </div>
    );
}

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            aria-hidden="true"
            data-slot="skeleton"
            {...props}
            className={cn(
                'wm-skeleton rounded-lg bg-gray-200 motion-safe:animate-pulse',
                className,
            )}
        />
    );
}

export function Progress({
    value,
    max = 10,
    label,
}: {
    value: number;
    max?: number;
    label: string;
}) {
    const progress = Math.min(max, Math.max(0, value));

    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={max}
            className="flex gap-1.5"
        >
            {Array.from({ length: max }, (_, index) => (
                <span
                    key={index}
                    className={cn(
                        'h-1.5 flex-1 rounded-full transition-colors duration-300',
                        index < progress ? 'bg-current' : 'bg-current/15',
                    )}
                />
            ))}
        </div>
    );
}

export function DiscreteNavigation({
    items,
}: {
    items: {
        label: string;
        href: string;
        active: boolean;
        icon: React.ReactNode;
    }[];
}) {
    const { t } = useTranslation();

    return (
        <nav
            aria-label={t('Secciones de la aplicación')}
            className="wm-navigation flex gap-2 overflow-x-auto py-2"
        >
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    aria-current={item.active ? 'page' : undefined}
                    className={cn(
                        'wm-nav-item flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
                        item.active
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 bg-white text-black/60 hover:border-gray-400 hover:text-black',
                    )}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}

export function Reveal({
    className,
    delay = 0,
    style,
    ...props
}: ComponentProps<'div'> & { delay?: number }) {
    return (
        <div
            {...props}
            className={cn('wm-reveal', className)}
            style={{ ...style, '--wm-delay': `${delay}ms` } as CSSProperties}
        />
    );
}
