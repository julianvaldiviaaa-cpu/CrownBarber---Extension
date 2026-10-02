import {
    FieldError,
    Link,
    Modal,
    TextField,
    useOverlayState,
} from '@heroui/react';
import { router, useForm } from '@inertiajs/react';
import { ArrowLeft, Mail, Phone, Trash2 } from 'lucide-react';
import type { SyntheticEvent } from 'react';
import { useEffect, useRef } from 'react';
import { route } from 'ziggy-js';
import ConfirmModal from '@/Components/ConfirmModal';
import { Button, Input, NativeButton, Card } from '@/Components/Watermelon';
import WorkerPortfolioEditor from '@/Components/WorkerPortfolioEditor';
import AppLayout from '@/Layouts/AppLayout';
import type { Translator } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n';
import { workers as assignBranch } from '@/routes/branches';
import { portfolio as savePortfolio } from '@/routes/workers';
import type { User, WorkerProfile } from '@/types';

type Props = {
    worker: User;
    portfolio: WorkerProfile;
    branches: { id: number; name: string }[];
};

const ROLES = (t: Translator): { value: User['role']; label: string }[] => [
    { value: 'user', label: t('Cliente') },
    { value: 'worker', label: t('Trabajador') },
    { value: 'admin', label: t('Administrador') },
];

// Borde invisible por default → punteado gray-300 en hover → sólido negro en focus.
const editableField =
    'border-b-2 border-transparent bg-transparent outline-none transition-colors duration-150 hover:border-dashed hover:border-gray-300 focus:border-solid focus:border-black';

export default function WorkerShow({ worker, portfolio, branches }: Props) {
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
        name: worker.name ?? '',
        email: worker.email ?? '',
        phone: worker.phone ?? '',
        role: worker.role ?? '',
    });

    const handleSubmit = (e: SyntheticEvent) => {
        e.preventDefault();
        put(route('workers.update', worker), { preserveScroll: true });
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

    const handleDelete = () => {
        router.delete(route('workers.destroy', worker));
    };

    return (
        <AppLayout navbar="dashboard">
            <form
                id="worker-form"
                onSubmit={handleSubmit}
                className="mx-auto max-w-5xl px-6 py-16 md:py-20"
            >
                <Link
                    href={route('workers')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.15em] text-black/40 uppercase transition-colors duration-150 hover:text-black"
                >
                    <ArrowLeft size={12} />
                    {t('Trabajadores')}{' '}
                </Link>

                {/* Header — nombre del trabajador */}
                <div className="mt-6">
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
                        className="block max-w-xl"
                    >
                        <Input
                            placeholder={t('Nombre del trabajador')}
                            className={`w-full px-0 py-1 text-4xl font-bold tracking-tight text-black md:text-5xl ${editableField}`}
                        />
                        <FieldError className="mt-2 block text-sm font-medium text-red-500">
                            {t(errors.name)}
                        </FieldError>
                    </TextField>
                </div>

                {/* Contenido distribuido: contacto a la izquierda, rol + acciones a la derecha */}
                <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
                    {/* Información de contacto */}
                    <div className="flex flex-col gap-8 md:col-span-2">
                        <div>
                            <h3 className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                                {t('Correo electrónico')}{' '}
                            </h3>
                            <TextField
                                name="email"
                                type="email"
                                value={data.email}
                                onChange={(value) => {
                                    setData('email', value);

                                    if (errors.email) {
                                        clearErrors('email');
                                    }
                                }}
                                isInvalid={!!errors.email}
                                className="mt-2 block"
                            >
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-black/30" />
                                    <Input
                                        placeholder="correo@ejemplo.com"
                                        className={`w-full px-0 py-1 text-lg tracking-tight text-black/70 ${editableField}`}
                                    />
                                </div>
                                <FieldError className="mt-1 block text-sm font-medium text-red-500">
                                    {t(errors.email)}
                                </FieldError>
                            </TextField>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                                {t('Teléfono')}{' '}
                            </h3>
                            <TextField
                                name="phone"
                                type="tel"
                                value={data.phone}
                                onChange={(value) => {
                                    setData('phone', value);

                                    if (errors.phone) {
                                        clearErrors('phone');
                                    }
                                }}
                                isInvalid={!!errors.phone}
                                className="mt-2 block"
                            >
                                <div className="flex items-center gap-2">
                                    <Phone
                                        size={16}
                                        className="text-black/30"
                                    />
                                    <Input
                                        placeholder={t('10 dígitos')}
                                        className={`w-full px-0 py-1 text-lg tracking-tight text-black/70 ${editableField}`}
                                    />
                                </div>
                                <FieldError className="mt-1 block text-sm font-medium text-red-500">
                                    {t(errors.phone)}
                                </FieldError>
                            </TextField>
                        </div>
                    </div>

                    {/* Panel lateral: rol + zona de peligro */}
                    <div className="flex flex-col gap-6 md:col-span-1">
                        <Card className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-xs font-semibold tracking-widest text-black/40 uppercase">
                                {t('Rol')}{' '}
                            </h3>
                            <select
                                value={data.role}
                                onChange={(e) => {
                                    setData(
                                        'role',
                                        e.target.value as User['role'],
                                    );

                                    if (errors.role) {
                                        clearErrors('role');
                                    }
                                }}
                                className="mt-3 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold tracking-tight text-black transition-colors duration-150 outline-none focus:border-black"
                            >
                                {ROLES(t).map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                            {errors.role && (
                                <p className="mt-1 text-xs font-medium text-red-500">
                                    {t(errors.role)}
                                </p>
                            )}
                        </Card>

                        {(worker.role === 'worker' ||
                            worker.role === 'admin') && (
                            <Card className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <label
                                    htmlFor="worker-branch"
                                    className="text-xs font-semibold tracking-widest text-black/40 uppercase"
                                >
                                    {t('Sucursal')}
                                </label>
                                <select
                                    id="worker-branch"
                                    value={worker.branch_id ?? ''}
                                    onChange={(event) =>
                                        router.patch(
                                            assignBranch.url(worker.id),
                                            {
                                                branch_id: Number(
                                                    event.target.value,
                                                ),
                                            },
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="mt-3 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-black"
                                >
                                    <option value="" disabled>
                                        {t('Elige una sucursal')}
                                    </option>
                                    {branches.map((branch) => (
                                        <option
                                            key={branch.id}
                                            value={branch.id}
                                        >
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </Card>
                        )}

                        {/* Zona de peligro */}
                        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
                            <h3 className="text-xs font-semibold tracking-widest text-red-400 uppercase">
                                {t('Eliminar Trabajdor')}{' '}
                            </h3>
                            <p className="mt-2 text-sm text-black/50">
                                {t(
                                    'Al eliminar a este trabajador perderá acceso a su cuenta. Esta acción no se puede deshacer.',
                                )}{' '}
                            </p>

                            <Modal>
                                <Button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold tracking-tight text-red-600 transition-colors duration-150 hover:bg-red-50">
                                    <Trash2 size={14} />
                                    {t('Eliminar trabajador')}{' '}
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
                                                        '¿Eliminar a este trabajador?',
                                                    )}{' '}
                                                </Modal.Heading>
                                            </Modal.Header>
                                            <Modal.Body>
                                                <p>
                                                    {t('Si eliminas a')}{' '}
                                                    <strong>
                                                        {worker.name}
                                                    </strong>
                                                    {t(
                                                        ', perderá acceso a su cuenta de inmediato. Esta acción no se puede deshacer.',
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

            {(worker.role === 'worker' || worker.role === 'admin') && (
                <div className="mx-auto max-w-5xl pb-16">
                    <WorkerPortfolioEditor
                        key={worker.id}
                        worker={portfolio}
                        submitUrl={savePortfolio.url(worker.id)}
                    />
                </div>
            )}

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
                        form="worker-form"
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
