import { usePage } from '@inertiajs/react';
import { useEffect, useEffectEvent } from 'react';
import { sileo, Toaster } from 'sileo';
import { useTranslation } from '@/lib/i18n';

export default function FlashMessages() {
    const { t } = useTranslation();

    const { flash } = usePage().props;

    const showMessages = useEffectEvent(() => {
        if (flash?.success) {
            sileo.success({
                title: t('Echo!'),
                description: t(flash.success),
                duration: 5000,
            });
        }

        if (flash?.error) {
            sileo.error({
                title: 'error',
                description: t(flash.error),
                duration: 5000,
                fill: 'black',
            });
        }
    });

    useEffect(() => {
        showMessages();
    }, [flash]);

    return <Toaster theme="light" position="bottom-right" />;
}
