import {
    FieldError,
    Link,
    Modal,
    TextField,
    useOverlayState,
} from '@heroui/react';
import { router, useForm } from '@inertiajs/react';
import { ArrowLeft, Clock, DollarSign, Trash2 } from 'lucide-react';
import type { SyntheticEvent } from 'react';
import { useEffect, useRef } from 'react';
import { route } from 'ziggy-js';
import ConfirmModal from '@/Components/ConfirmModal';
import {
    Button,
    Input,
    NativeButton,
    Textarea,
    Card,
} from '@/Components/Watermelon';
import AppLayout from '@/Layouts/AppLayout';
import { useTranslation } from '@/lib/i18n';
import type { Service } from '@/types';

type Props = {
    service: Service;
    branches: { id: number; name: string }[];
    branchIds: number[];
};

// Borde invisible por default → punteado gray-300 en hover → sólido negro en focus.
const editableField =
    'border-b-2 border-transparent bg-transparent outline-none transition-colors duration-150 hover:border-dashed hover:border-gray-300 focus:border-solid focus:border-black';

export default function ServiceShow({ service, branches, branchIds }: Props) {
    const { t } = useTranslation();

    const {
        data,
        setData,
        errors,
        clearErrors,
        put,
        processing,
        isDirty,
        reset,
    } = useForm({
        name: service.name ?? '',
        description: service.description ?? '',
        price: service.price ?? 0,
        duration: service.duration ?? 0,
        loyalty_reward_type: service.loyalty_reward_type ?? '',
        branches: branchIds,
    });

    const handleSubmit = (e: SyntheticEvent) => {
        e.preventDefault();
        put(route('services.update', service), { preserveScroll: true });
    };

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirty) {
                return;
            }

            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);

        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    const leaveState = useOverlayState();
    const pendingUrlRef = useRef<URL | null>(null);
    const allowLeaveRef = useRef(false);

    useEffect(() => {
        return router.on('before', (event) => {
            if (allowLeaveRef.current) {
                allowLeaveRef.current = false;

                return true;
            }

            if (!isDirty) {
                return true;
            }

            if (event.detail.visit.method !== 'get') {
                return true;
            }

            pendingUrlRef.current = event.detail.visit.url;
            leaveState.open();

            return false;
        });
    }, [isDirty, leaveState]);

    const confirmLeave = () => {
        const url = pendingUrlRef.current;
        pendingUrlRef.current = null;

        if (!url) {
            return;
        }

        allowLeaveRef.current = true;
        router.visit(url);
    };

    const handleStatusChange = (service: Service, active: boolean) => {
        router.patch(
            route('services.active', service),
            { active },
            { preserveScroll: true },
        );
    };

    const handleDelete = () => {
        router.delete(route('services.destroy', service));
    };

    return (
        <AppLayout navbar="dashboard">
            <form
                id="service-form"
                onSubmit={handleSubmit}
                className="mx-auto max-w-5xl px-6 py-16 md:py-20"
            >
                <Link
                    href={route('services')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.15em] text-black/40 uppercase transition-colors duration-150 hover:text-black"
                >
                    <ArrowLeft size={12} />
                    {t('Servicios')}{' '}
                </Link>

                {/* Header — título a la izquierda + estado a la derecha, no centrado */}
                <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
                    <TextField
                        name="name"
                        value={data.name}
                        onChange={(value) => {
                            setData('name', value);

                            if (errors.name) {
                                clearErrors('name');
                            }
                        }}
                        isInvalid={!!errors.name}
                        className="block max-w-xl min-w-0 flex-1"
                    >
                        <Input
                            placeholder={t('Nombre del servicio')}
                            className={`w-full px-0 py-1 text-4xl font-bold tracking-tight text-black md:text-5xl ${editableField}`}
                        />
                        <FieldError className="mt-2 block text-sm font-medium text-red-500">
                            {t(errors.name)}
                        </FieldError>
                    </TextField>

                    <NativeButton
                        type="button"
                        onClick={() =>
                            handleStatusChange(service, !service.active)
                        }
                        title={t('Cambiar estado del servicio')}
                        className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold tracking-tight transition-colors duration-150 ${
                            service.active
                                ? 'border-green-200 bg-green-50 text-green-700 hover:border-green-300'
                                : 'border-red-200 bg-red-50 text-red-700 hover:border-red-300'
                        }`}
                    >
                        <span
                            className={`h-2 w-2 rounded-full ${
                                service.active ? 'bg-green-500' : 'bg-red-500'
                            }`}
                        />
                        {service.active ? t('Activo') : t('No Activo')}
                    </NativeButton>
                </div>

                {/* Contenido distribuido: descripción a la izquierda, detalles + acciones a la derecha */}
                <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
                    <fieldset className="col-span-full rounded-2xl border border-gray-200 p-5">
                        <legend className="px-2 text-sm font-semibold">
                            {t('Sucursales que ofrecen este servicio')}
                        </legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {branches.map((branch) => (
                                <label
                                    key={branch.id}
                                    className="flex min-h-11 items-center gap-3"
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
                            <p className="text-sm text-red-600">
                                {errors.branches}
                            </p>
                        )}
                    </fieldset>
                    {/* Descripción */}
                    <div className="md:col-span-2">
                        <h3 className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                            {t('Descripción')}{' '}
                        </h3>
                        <TextField
                            name="description"
                            value={data.description}
                            onChange={(value) => {
                                setData('description', value);

                                if (errors.description) {
                                    clearErrors('description');
                                }
                            }}
                            isInvalid={!!errors.description}
                            className="mt-3 block"
                        >
                            <Textarea
                                value={data.description}
                                onChange={(e) => {
                                    setData('description', e.target.value);

                                    if (errors.description) {
                                        clearErrors('description');
                                    }
                                }}
                                rows={7}
                                placeholder={t(
                                    'Describe en qué consiste el servicio…',
                                )}
                                className={`-mx-3 w-full resize-none rounded-md px-3 py-2 text-lg/8 tracking-tight text-black/70 hover:bg-black/[0.02] focus:bg-black/[0.02] ${editableField}`}
                            />
                            <FieldError className="mt-2 block text-sm font-medium text-red-500">
                                {t(errors.description)}
                            </FieldError>
                        </TextField>
                    </div>

                    {/* Panel lateral: detalles + zona de peligro */}
                    <div className="flex flex-col gap-6 md:col-span-1">
                        <Card className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                                {t('Detalles')}{' '}
                            </h3>

                            <div className="mt-4 flex flex-col gap-4">
                                <div className="col-span-full flex flex-col gap-2">
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
                                            {t('No participa como premio')}{' '}
                                        </option>
                                        <option value="haircut">
                                            {t('Corte de cabello gratis')}{' '}
                                        </option>
                                        <option value="facial">
                                            {t('Facial gratis')}{' '}
                                        </option>
                                    </select>
                                    <p className="text-xs opacity-60">
                                        {t(
                                            'Habilita cortes de cabello o faciales. Se descuenta un servicio al canjear la tarjeta.',
                                        )}{' '}
                                    </p>
                                    {errors.loyalty_reward_type && (
                                        <p
                                            role="alert"
                                            className="text-sm text-red-500"
                                        >
                                            {t(errors.loyalty_reward_type)}
                                        </p>
                                    )}
                                </div>
                                <TextField
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
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-1.5 text-sm text-black/50">
                                            <DollarSign size={14} />
                                            {t('Precio')}{' '}
                                        </span>
                                        <Input
                                            min={0}
                                            step="0.01"
                                            className={`[field-sizing:content] w-24 px-0 py-0.5 text-right text-lg font-bold ${editableField}`}
                                        />
                                    </div>
                                    <FieldError className="mt-1 block text-right text-xs font-medium text-red-500">
                                        {t(errors.price)}
                                    </FieldError>
                                </TextField>

                                <div className="h-px w-full bg-gray-100" />

                                <TextField
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
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-1.5 text-sm text-black/50">
                                            <Clock size={14} />
                                            {t('Duración')}{' '}
                                        </span>
                                        <div className="flex items-baseline gap-1">
                                            <Input
                                                min={0}
                                                className={`[field-sizing:content] w-10 px-0 py-0.5 text-right text-lg font-bold ${editableField}`}
                                            />
                                            <span className="text-sm text-black/40">
                                                {t('min')}{' '}
                                            </span>
                                        </div>
                                    </div>
                                    <FieldError className="mt-1 block text-right text-xs font-medium text-red-500">
                                        {t(errors.duration)}
                                    </FieldError>
                                </TextField>
                            </div>
                        </Card>

                        {/* Zona de peligro */}
                        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
                            <h3 className="text-xs font-semibold tracking-widest text-red-400 uppercase">
                                {t('Eliminar servicio')}{' '}
                            </h3>
                            <p className="mt-2 text-sm text-black/50">
                                {t(
                                    'Al eliminar este servicio ya no podrás ofrecerlo a tus clientes. Esta acción no se puede deshacer.',
                                )}{' '}
                            </p>

                            <Modal>
                                <Button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold tracking-tight text-red-600 transition-colors duration-150 hover:bg-red-50">
                                    <Trash2 size={14} />
                                    {t('Eliminar servicio')}{' '}
                                </Button>
                                <Modal.Backdrop>
                                    <Modal.Container>
                                        <Modal.Dialog className="wm-overlay">
                                            <Modal.CloseTrigger />
                                            <Modal.Header>
                                                <Modal.Icon>
                                                    <Trash2 />
                                                </Modal.Icon>
                                                <Modal.Heading>
                                                    {t(
                                                        '¿Eliminar este servicio?',
                                                    )}{' '}
                                                </Modal.Heading>
                                            </Modal.Header>
                                            <Modal.Body>
                                                <p>
                                                    {t('Si eliminas')}{' '}
                                                    <strong>
                                                        {service.name}
                                                    </strong>
                                                    {t(
                                                        ', ya no podrás ofrecerlo a ninguno de tus clientes. Esta acción no se puede deshacer.',
                                                    )}{' '}
                                                </p>
                                            </Modal.Body>
                                            <Modal.Footer className="flex items-center justify-center gap-3">
                                                <Button
                                                    slot="close"
                                                    className="w-full rounded-full border border-gray-200 py-2.5 text-sm font-semibold tracking-tight text-black/70"
                                                >
                                                    {t('Cancelar')}{' '}
                                                </Button>
                                                <Button
                                                    onClick={handleDelete}
                                                    className="w-full rounded-full bg-red-600 py-2.5 text-sm font-semibold tracking-tight text-white hover:bg-red-700"
                                                >
                                                    {t('Eliminar')}{' '}
                                                </Button>
                                            </Modal.Footer>
                                        </Modal.Dialog>
                                    </Modal.Container>
                                </Modal.Backdrop>
                            </Modal>
                        </div>
                    </div>
                </div>
            </form>

            {/* Barra de guardado — discreta pero notoria, solo aparece con cambios sin guardar */}
            <div
                className={`fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-300 ${
                    isDirty
                        ? 'translate-y-0 opacity-100'
                        : 'pointer-events-none translate-y-4 opacity-0'
                }`}
                aria-hidden={!isDirty}
            >
                <div className="flex items-center gap-4 rounded-full border border-gray-700 bg-black px-5 py-2.5 shadow-xl shadow-black/30">
                    <p className="text-sm font-medium tracking-tight text-gray-300">
                        {t('Cambios sin guardar')}{' '}
                    </p>
                    <NativeButton
                        type="button"
                        onClick={() => reset()}
                        className="text-sm font-medium tracking-tight text-white/40 transition-colors duration-150 hover:text-white"
                    >
                        {t('Descartar')}{' '}
                    </NativeButton>
                    <NativeButton
                        type="submit"
                        form="service-form"
                        disabled={processing}
                        className="rounded-full bg-white px-5 py-2 text-sm font-semibold tracking-tight text-black transition-transform duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? t('Guardando…') : t('Guardar cambios')}
                    </NativeButton>
                </div>
            </div>

            <ConfirmModal
                state={leaveState}
                heading={t('Cambios sin guardar')}
                message={t(
                    '¿Salir de todos modos? Los cambios que no hayas guardado se perderán.',
                )}
                confirmLabel={t('Salir sin guardar')}
                onConfirm={confirmLeave}
            />
        </AppLayout>
    );
}
