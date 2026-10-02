import { FieldError, Form, Label, TextField } from '@heroui/react';
import { useForm, router } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { SyntheticEvent } from 'react';
import { route } from 'ziggy-js';
import { Button, Input, NativeButton, Textarea } from '@/Components/Watermelon';
import FormLayout from '@/Layouts/FormLayout';
import { useTranslation } from '@/lib/i18n';

export default function ServiceCreate({
    branches,
}: {
    branches: { id: number; name: string }[];
}) {
    const { t } = useTranslation();

    const { data, setData, errors, clearErrors, post, processing, reset } =
        useForm({
            name: '',
            description: '',
            price: 0,
            duration: 0,
            loyalty_reward_type: '',
            branches: branches[0] ? [branches[0].id] : ([] as number[]),
        });

    const handleSubmit = (e: SyntheticEvent) => {
        e.preventDefault();
        post(route('services.store'), {
            onSuccess: () => {
                reset();
            },
            preserveScroll: true,
        });
    };

    return (
        <FormLayout navbar="dashboard">
            <Button
                onClick={() => router.get(route('dashboard'))}
                className="mb-10 flex items-center justify-center gap-2 bg-black text-gray-300 transition-all duration-300 hover:gap-4"
            >
                <ChevronLeft /> {t('Dashboard')}{' '}
            </Button>
            <Form
                onSubmit={handleSubmit}
                className="mx-auto flex w-full max-w-3xl flex-col items-center rounded-3xl bg-black px-6 py-12 md:px-12 md:py-20"
            >
                <h2 className="text-center text-4xl font-medium tracking-[-0.02em] text-white capitalize md:text-5xl">
                    {t('Crear Servicio')}{' '}
                </h2>
                <p className="mx-auto my-6 max-w-sm text-center text-base/6 tracking-tight text-white/60">
                    {t(
                        'Llena el siguiente formulario para crear un servicio que podrás ofrecer a tus clientes',
                    )}{' '}
                </p>

                <div className="mt-6 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                    <fieldset className="col-span-full text-white/80">
                        <legend className="text-sm font-medium">
                            {t('Sucursales que ofrecen este servicio')}
                        </legend>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {branches.map((branch) => (
                                <label
                                    key={branch.id}
                                    className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2"
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.branches.includes(
                                            branch.id,
                                        )}
                                        onChange={() =>
                                            setData(
                                                'branches',
                                                data.branches.includes(
                                                    branch.id,
                                                )
                                                    ? data.branches.filter(
                                                          (id) =>
                                                              id !== branch.id,
                                                      )
                                                    : [
                                                          ...data.branches,
                                                          branch.id,
                                                      ],
                                            )
                                        }
                                    />
                                    {branch.name}
                                </label>
                            ))}
                        </div>
                        {errors.branches && (
                            <p className="mt-1 text-sm text-red-500">
                                {errors.branches}
                            </p>
                        )}
                    </fieldset>
                    <div className="col-span-full flex flex-col gap-2 text-white/80">
                        <label
                            htmlFor="loyalty_reward_type"
                            className="text-sm font-medium"
                        >
                            {t('Premio de fidelidad')}{' '}
                        </label>
                        <select
                            id="loyalty_reward_type"
                            value={data.loyalty_reward_type}
                            onChange={(event) =>
                                setData(
                                    'loyalty_reward_type',
                                    event.target.value,
                                )
                            }
                            className="wm-input min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-black"
                        >
                            <option value="">
                                {t('No participa como premio')}
                            </option>
                            <option value="haircut">
                                {t('Corte de cabello gratis')}{' '}
                            </option>
                            <option value="facial">{t('Facial gratis')}</option>
                        </select>
                        <p className="text-xs opacity-60">
                            {t(
                                'Habilita cortes de cabello o faciales. Se descuenta un servicio al canjear la tarjeta.',
                            )}{' '}
                        </p>
                        {errors.loyalty_reward_type && (
                            <p role="alert" className="text-sm text-red-500">
                                {t(errors.loyalty_reward_type)}
                            </p>
                        )}
                    </div>
                    <TextField
                        isRequired
                        name="name"
                        type="text"
                        value={data.name}
                        onChange={(value) => {
                            setData('name', value);

                            if (errors.name) {
                                clearErrors('name');
                            }
                        }}
                        isInvalid={!!errors.name}
                        className="col-span-1 md:col-span-2"
                    >
                        <Label className="text-sm font-medium tracking-tight text-white/80">
                            {t('Nombre del Servicio')}{' '}
                        </Label>
                        <Input
                            placeholder={t('Ej. Corte Clásico')}
                            className="w-full rounded-lg bg-white/5 px-4 py-3 text-white transition-colors duration-150 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-500"
                        />
                        <FieldError className="text-sm font-medium text-red-500">
                            {t(errors.name)}
                        </FieldError>
                    </TextField>

                    <div className="col-span-1 flex flex-col gap-2 md:col-span-2">
                        <label
                            htmlFor="description"
                            className="text-sm font-medium tracking-tight text-white/80"
                        >
                            {t('Descripción')}{' '}
                        </label>
                        <Textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={data.description}
                            onChange={(e) => {
                                setData('description', e.target.value);

                                if (errors.description) {
                                    clearErrors('description');
                                }
                            }}
                            placeholder={t(
                                'Describe en qué consiste el servicio',
                            )}
                            className="w-full resize-none rounded-lg bg-white/5 px-4 py-3 text-white transition-colors duration-150 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-500"
                        />
                        {errors.description && (
                            <p className="text-sm font-medium text-red-500">
                                {t(errors.description)}
                            </p>
                        )}
                    </div>

                    <TextField
                        isRequired
                        name="price"
                        type="number"
                        value={String(data.price)}
                        onChange={(value) => {
                            setData('price', Number(value));

                            if (errors.price) {
                                clearErrors('price');
                            }
                        }}
                        isInvalid={!!errors.price}
                    >
                        <Label className="text-sm font-medium tracking-tight text-white/80">
                            {t('Precio')}{' '}
                        </Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-white/40">
                                $
                            </span>
                            <Input
                                placeholder="0.00"
                                min={0}
                                step="0.01"
                                className="w-full rounded-lg bg-white/5 py-3 pr-4 pl-8 text-white transition-colors duration-150 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <FieldError className="text-sm font-medium text-red-500">
                            {t(errors.price)}
                        </FieldError>
                    </TextField>

                    <TextField
                        isRequired
                        name="duration"
                        type="number"
                        value={String(data.duration)}
                        onChange={(value) => {
                            setData('duration', Number(value));

                            if (errors.duration) {
                                clearErrors('duration');
                            }
                        }}
                        isInvalid={!!errors.duration}
                    >
                        <Label className="text-sm font-medium tracking-tight text-white/80">
                            {t('Duración')}{' '}
                        </Label>
                        <div className="relative">
                            <Input
                                placeholder="30"
                                min={0}
                                className="w-full rounded-lg bg-white/5 py-3 pr-16 pl-4 text-white transition-colors duration-150 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-white/40">
                                {t('min')}{' '}
                            </span>
                        </div>
                        <FieldError className="text-sm font-medium text-red-500">
                            {t(errors.duration)}
                        </FieldError>
                    </TextField>
                </div>

                <NativeButton
                    type="submit"
                    disabled={processing}
                    className="mt-10 w-full max-w-xs bg-white py-3.5 text-lg font-semibold tracking-tight text-black transition-transform duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {processing ? t('Guardando…') : t('Crear Servicio')}
                </NativeButton>
            </Form>
        </FormLayout>
    );
}
