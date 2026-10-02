import { router, usePage } from '@inertiajs/react';
import { MailCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { NativeButton } from '@/Components/Watermelon';
import AppLayout from '@/Layouts/AppLayout';
import { useTranslation } from '@/lib/i18n';

export default function EmailVerify() {
    const { t } = useTranslation();

    const { auth, status } = usePage().props;
    const user = auth?.user;

    const [sending, setSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown === 0) {
            return;
        }

        const id = setInterval(() => setCooldown((c) => c - 1), 1000);

        return () => clearInterval(id);
    }, [cooldown]);

    const handleResend = () => {
        if (sending || cooldown > 0) {
            return;
        }

        setSending(true);
        router.post(route('verification.send'), undefined, {
            preserveScroll: true,
            onFinish: () => {
                setSending(false);
                setCooldown(60);
            },
        });
    };

    const justSent = status === 'verification-link-sent';

    return (
        <AppLayout navbar="guest">
            <div className="mx-auto mt-16 flex max-w-xl flex-col items-center px-6 md:mt-24">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                    <MailCheck className="text-amber-500" size={28} />
                </div>

                <h1 className="mt-8 text-center text-4xl font-medium tracking-[-0.02em] md:text-6xl">
                    {t('Verifica tu email')}{' '}
                </h1>
                <p className="mt-4 text-center text-base/6 tracking-tight text-black/60">
                    {t('Enviamos un enlace de verificación a')}{' '}
                    <span className="font-medium text-black">
                        {user?.email}
                    </span>
                    {t('. Ábrelo para activar tu cuenta.')}{' '}
                </p>

                <div className="mt-12 w-full rounded-2xl bg-black p-8 text-center">
                    <h2 className="text-xl font-medium tracking-tight text-white">
                        {t('¿No te llegó nada?')}{' '}
                    </h2>
                    <p className="mt-2 text-sm tracking-tight text-white/50">
                        {t(
                            'Revisa spam o pide que te lo enviemos de nuevo',
                        )}{' '}
                    </p>

                    <div className="mt-6 flex flex-col items-center gap-3">
                        <NativeButton
                            type="button"
                            onClick={handleResend}
                            disabled={sending || cooldown > 0}
                            className="border-2 border-white px-6 py-3.5 text-center text-sm font-semibold tracking-tight text-white transition-transform duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:border-white/30 disabled:text-white/30 disabled:active:scale-100"
                        >
                            {sending
                                ? t('Enviando…')
                                : cooldown > 0
                                  ? t('Reenviar en {seconds}s', {
                                        seconds: cooldown,
                                    })
                                  : t('Reenviar Email')}
                        </NativeButton>

                        {justSent && !sending && (
                            <p className="text-sm font-medium tracking-tight text-amber-400">
                                {t(
                                    'Enlace reenviado. Revisa tu bandeja de entrada.',
                                )}{' '}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
