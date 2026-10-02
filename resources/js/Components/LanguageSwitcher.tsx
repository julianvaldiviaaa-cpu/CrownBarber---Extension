import { Languages } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function LanguageSwitcher() {
    const { language, t, setLanguage } = useTranslation();

    return (
        <div
            className="flex shrink-0 items-center gap-1 rounded-full border border-current/20 p-1"
            role="group"
            aria-label={t('Idioma')}
        >
            <Languages
                size={15}
                className="mx-1 hidden sm:block"
                aria-hidden="true"
            />
            {(['es', 'en'] as const).map((locale) => (
                <button
                    key={locale}
                    type="button"
                    lang={locale}
                    aria-label={t(locale === 'es' ? 'Español' : 'Inglés')}
                    aria-pressed={language === locale}
                    onClick={() => setLanguage(locale)}
                    className={`min-h-9 min-w-9 rounded-full px-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${language === locale ? 'bg-black text-white' : 'text-current hover:bg-black/5'}`}
                >
                    {locale.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
