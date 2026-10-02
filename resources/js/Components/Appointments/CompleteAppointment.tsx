import { useForm } from '@inertiajs/react';
import { CheckCheck, Gift } from 'lucide-react';
import { useState } from 'react';
import { AnimatedButton, Card } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import { formatMoney } from '@/lib/utils';
import { complete } from '@/routes/appointments';
import type { Appointment, Loyalty } from '@/types';

export default function CompleteAppointment({
    appointment,
    loyalty,
}: {
    appointment: Appointment;
    loyalty: Loyalty;
}) {
    const { t, intlLocale } = useTranslation();

    const eligible = (appointment.services ?? []).filter(
        (service) =>
            service.loyalty_reward_type && Number(service.pivot.price) > 0,
    );
    const form = useForm({ loyalty_reward_service_id: '' as string | number });
    const [confirming, setConfirming] = useState(false);
    const selected = eligible.find(
        (service) => service.id === Number(form.data.loyalty_reward_service_id),
    );

    return (
        <Card className="border-black/15">
            <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <CheckCheck size={20} />
                    {t('Finalizar atención')}{' '}
                </h2>
                <p className="mt-2 text-sm leading-6 text-black/55">
                    {t(
                        'Confirma que el cliente recibió el servicio y pagó el importe correspondiente. Registraremos como máximo un sello por día.',
                    )}{' '}
                </p>
            </div>
            {loyalty.rewards_available > 0 && (
                <div className="rounded-xl bg-neutral-100 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Gift size={16} />
                        {t('El cliente tiene un premio disponible')}{' '}
                    </p>
                    {eligible.length ? (
                        <label className="flex flex-col gap-2 text-sm">
                            {t('Servicio gratis de esta cita')}{' '}
                            <select
                                className="wm-input min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3"
                                value={form.data.loyalty_reward_service_id}
                                onChange={(event) => {
                                    form.setData(
                                        'loyalty_reward_service_id',
                                        event.target.value,
                                    );
                                    setConfirming(false);
                                }}
                            >
                                <option value="">
                                    {t('Selecciona el corte o facial')}{' '}
                                </option>
                                {eligible.map((service) => (
                                    <option value={service.id} key={service.id}>
                                        {service.pivot.name} ·{' '}
                                        {formatMoney(
                                            service.pivot.price,
                                            intlLocale,
                                        )}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : (
                        <p className="text-sm leading-6 text-black/55">
                            {t(
                                'Esta cita no incluye un corte o facial habilitado como premio. El beneficio seguirá disponible para una próxima visita.',
                            )}{' '}
                        </p>
                    )}
                    <p className="mt-3 text-xs leading-5 text-black/50">
                        {t(
                            'El canje requiere nueve visitas pagadas en días anteriores y ninguna visita registrada en el día de esta cita.',
                        )}{' '}
                    </p>
                </div>
            )}
            <div className="flex items-center justify-between gap-4 text-sm">
                <span>{t('Total al finalizar')}</span>
                <strong className="text-xl">
                    {formatMoney(
                        Math.max(
                            0,
                            Number(appointment.total_price) -
                                Number(selected?.pivot.price ?? 0),
                        ),
                        intlLocale,
                    )}
                </strong>
            </div>
            {form.errors.loyalty_reward_service_id && (
                <p role="alert" className="text-sm text-red-700">
                    {t(form.errors.loyalty_reward_service_id)}
                </p>
            )}
            {confirming ? (
                <div className="flex flex-col gap-3">
                    <p className="text-sm text-black/60">
                        {t(
                            '¿Confirmas la atención y el cobro? Esta acción cierra la cita',
                        )}
                        {selected ? t(' y canjea el premio') : ''}.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <AnimatedButton
                            disabled={form.processing}
                            onClick={() =>
                                form.post(complete.url(appointment.id), {
                                    preserveScroll: true,
                                    onError: () => setConfirming(false),
                                })
                            }
                            className="bg-black text-white"
                        >
                            {form.processing
                                ? t('Registrando…')
                                : t('Sí, completar visita')}
                        </AnimatedButton>
                        <AnimatedButton
                            disabled={form.processing}
                            onClick={() => setConfirming(false)}
                            className="border border-gray-200"
                        >
                            {t('Volver')}{' '}
                        </AnimatedButton>
                    </div>
                </div>
            ) : (
                <AnimatedButton
                    onClick={() => setConfirming(true)}
                    className="bg-black text-white"
                >
                    {selected
                        ? t('Completar y canjear premio')
                        : t('Completar visita')}
                </AnimatedButton>
            )}
        </Card>
    );
}
