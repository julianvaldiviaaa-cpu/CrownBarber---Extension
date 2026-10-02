import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getIntlLocale } from './i18n';

/** Intervalo de auto-actualización de notificaciones y citas (15 s). */
export const POLL_INTERVAL_MS = 15_000;

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Da formato de moneda MXN a un número o string decimal. */
export function formatMoney(
    value: number | string,
    locale = getIntlLocale(),
): string {
    const number = Number(value);

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    }).format(Number.isFinite(number) ? number : 0);
}

/** Da formato de fecha corta (d/m/Y) a una fecha ISO. */
export function formatDate(
    value: string | Date,
    locale = getIntlLocale(),
): string {
    const date = new Date(value);

    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

/** Da formato de hora (H:mm AM/PM, 12 horas) a una fecha ISO. */
export function formatTime(value: string | Date): string {
    const date = new Date(value);
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const suffix = date.getHours() >= 12 ? 'PM' : 'AM';

    return `${hours}:${minutes} ${suffix}`;
}

/** Convierte un slot "H:i" (24 h) a formato 12 horas, ej. "13:30" -> "1:30 PM". */
export function formatSlotTime(value: string): string {
    const [hour, minute] = value.split(':').map(Number);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hours = hour % 12 || 12;

    return `${hours}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/** Convierte "2026-08-20 10:30:00" (zona local del servidor) a Date local. */
export function parseServerDate(value: string): Date {
    return new Date(value.replace(' ', 'T'));
}

/** Convierte "YYYY-MM-DD" a Date local sin desfase por zona horaria. */
export function parseDateOnly(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
}

/** Devuelve la fecha como "YYYY-MM-DD" para inputs date. */
export function toISODate(value: Date): string {
    const offset = value.getTimezoneOffset();
    const local = new Date(value.getTime() - offset * 60_000);

    return local.toISOString().slice(0, 10);
}
