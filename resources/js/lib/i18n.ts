import { useMemo, useSyncExternalStore } from 'react';
import { english } from './translations';

export type Language = 'es' | 'en';
export type TranslationParams = Record<string, string | number>;
export type Translator = (
    text: string | null | undefined,
    params?: TranslationParams,
) => string;

export const LANGUAGE_STORAGE_KEY = 'crown-language';
const listeners = new Set<() => void>();
let language: Language = 'es';
const spanish = Object.fromEntries(
    Object.entries(english).map(([es, en]) => [en, es]),
);
const escapePattern = (text: string) =>
    text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const messageTemplates = Object.entries(english)
    .filter(([es]) => /\{\w+\}/.test(es))
    .map(([es, en]) => {
        const keys = [...es.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
        const pattern = (template: string) =>
            new RegExp(
                `^${template
                    .split(/\{\w+\}/)
                    .map(escapePattern)
                    .join('(.+?)')}$`,
            );

        return { es, en, keys, esPattern: pattern(es), enPattern: pattern(en) };
    });

function interpolate(text: string, params: TranslationParams): string {
    return text.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
        Object.hasOwn(params, key) ? String(params[key]) : placeholder,
    );
}

export function translate(
    text: string | null | undefined,
    locale: Language = language,
    params: TranslationParams = {},
): string {
    const source = text ?? '';
    const translated =
        locale === 'en'
            ? Object.hasOwn(english, source)
                ? english[source]
                : undefined
            : Object.hasOwn(spanish, source)
              ? spanish[source]
              : undefined;

    if (translated !== undefined || Object.hasOwn(english, source)) {
        return interpolate(translated ?? source, params);
    }

    for (const template of messageTemplates) {
        const match = (
            locale === 'en' ? template.esPattern : template.enPattern
        ).exec(source);

        if (match) {
            const sourceKeys =
                locale === 'en'
                    ? template.keys
                    : [...template.en.matchAll(/\{(\w+)\}/g)].map(
                          (part) => part[1],
                      );
            const values = Object.fromEntries(
                sourceKeys.map((key, index) => [key, match[index + 1]]),
            );

            return interpolate(locale === 'en' ? template.en : template.es, {
                ...values,
                ...params,
            });
        }
    }

    return interpolate(source, params);
}

export function getLanguage(): Language {
    return language;
}

export function translateCurrent(
    text: string | null | undefined,
    params?: TranslationParams,
): string {
    return translate(text, language, params);
}

export function getIntlLocale(): string {
    return language === 'en' ? 'en-US' : 'es-MX';
}

export function setLanguage(nextLanguage: Language): void {
    if (!['es', 'en'].includes(nextLanguage)) {
        return;
    }

    if (typeof window !== 'undefined') {
        if (language !== nextLanguage) {
            window.dispatchEvent(new Event('crown:before-language-change'));
        }

        try {
            window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
        } catch {
            // La selección sigue funcionando cuando el navegador bloquea el almacenamiento.
        }

        document.documentElement.lang = nextLanguage;
    }

    language = nextLanguage;
    listeners.forEach((listener) => listener());
}

export function initializeLanguage(): () => void {
    try {
        const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        setLanguage(stored === 'en' ? 'en' : 'es');
    } catch {
        setLanguage('es');
    }

    const onStorage = (event: StorageEvent) => {
        if (event.key === LANGUAGE_STORAGE_KEY) {
            setLanguage(event.newValue === 'en' ? 'en' : 'es');
        }
    };
    window.addEventListener('storage', onStorage);

    return () => window.removeEventListener('storage', onStorage);
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function useTranslation() {
    const locale = useSyncExternalStore(
        subscribe,
        getLanguage,
        () => 'es' as const,
    );
    const t = useMemo<Translator>(
        () => (text, params) => translate(text, locale, params),
        [locale],
    );

    return {
        language: locale,
        intlLocale: locale === 'en' ? 'en-US' : 'es-MX',
        t,
        setLanguage,
    };
}
