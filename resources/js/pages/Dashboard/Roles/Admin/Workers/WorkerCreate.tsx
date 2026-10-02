import { FieldError, Form, Label, TextField } from '@heroui/react';
import { useForm, router } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { SyntheticEvent } from 'react';
import { route } from 'ziggy-js';
import { Button, Input, NativeButton } from '@/Components/Watermelon';
import FormLayout from '@/Layouts/FormLayout';
import type { Translator } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n';

const ROLES = (t: Translator) => [
    { value: 'user', label: t('Cliente') },
    { value: 'worker', label: t('Trabajador') },
    { value: 'admin', label: t('Administrador') },
];

export default function WorkerCreate({
    branches,
}: {
    branches: { id: number; name: string }[];
}) {
    const { t } = useTranslation();

    const { data, setData, errors, clearErrors, post, reset, processing } =
        useForm({
            name: '',
            email: '',
            phone: '',
            role: '',
            branch_id: branches[0]?.id ?? '',
            password: '',
            password_confirmation: '',
        });

    const handleSubmit = (e: SyntheticEvent) => {
        e.preventDefault();
        post(route('workers.store'), {
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
                className="mx-auto flex w-full max-w-3xl flex-col items-center rounded-3xl bg-black px-6 py-12 md:px-12"
            >
                <h1 className="text-center text-4xl font-medium tracking-[-0.02em] text-white md:text-5xl">
                    {t('Nuevo Empleado')}{' '}
                </h1>
                <p className="mx-auto my-6 max-w-sm text-center text-base/6 tracking-tight text-white/60">
                    {t(
                        'Llena el siguiente formulario para dar de alta a un nuevo empleado y asignarle su rol',
                    )}{' '}
                </p>

                <div className="mt-6 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
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
                            {t('Nombre')}{' '}
                        </Label>
                        <Input
                            placeholder={t('Nombre completo')}
                            className="w-full rounded-lg bg-white/5 px-4 py-3 text-white transition-colors duration-150 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-500"
                        />
                        <FieldError className="text-sm font-medium text-red-500">
                            {t(errors.name)}
                        </FieldError>
                    </TextField>

                    <TextField
                        isRequired
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
                    >
                        <Label className="text-sm font-medium tracking-tight text-white/80">
                            {t('Correo electrónico')}{' '}
                        </Label>
                        <Input
                            placeholder="tu@correo.com"
                            className="w-full rounded-lg bg-white/5 px-4 py-3 text-white transition-colors duration-150 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-500"
                        />
                        <FieldError className="text-sm font-medium text-red-500">
                            {t(errors.email)}
                        </FieldError>
                    </TextField>

                    <TextField
                        isRequired
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
                    >
                        <Label className="text-sm font-medium tracking-tight text-white/80">
                            {t('Teléfono')}{' '}
                        </Label>
                        <Input
                            placeholder={t('10 dígitos')}
                            className="w-full rounded-lg bg-white/5 px-4 py-3 text-white transition-colors duration-150 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-500"
                        />
                        <FieldError className="text-sm font-medium text-red-500">
                            {t(errors.phone)}
                        </FieldError>
                    </TextField>

                    {/* Rol — select nativo estilizado para combinar con el resto de los campos */}
                    <div className="col-span-1 flex flex-col gap-2 md:col-span-2">
                        <label
                            htmlFor="role"
                            className="text-sm font-medium tracking-tight text-white/80"
                        >
                            {t('Rol')}{' '}
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={data.role}
                            onChange={(e) => {
                                setData(
                                    'role',
                                    e.target.value as
                                        'user' | 'worker' | 'admin',
                                );

                                if (errors.role) {
                                    clearErrors('role');
                                }
                            }}
                            className="bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%23ffffff80%22><path fill-rule=%22evenodd%22 d=%22M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z%22 clip-rule=%22evenodd%22/></svg>')] w-full appearance-none rounded-lg bg-white/5 bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat px-4 py-3 text-white transition-colors duration-150 outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="" disabled className="text-black">
                                {t('Selecciona un rol')}{' '}
                            </option>
                            {ROLES(t).map((role) => (
                                <option
                                    key={role.value}
                                    value={role.value}
                                    className="text-black"
                                >
                                    {role.label}
                                </option>
                            ))}
                        </select>
                        {errors.role && (
                            <p className="text-sm font-medium text-red-500">
                                {t(errors.role)}
                            </p>
                        )}
                    </div>

                    {(data.role === 'worker' || data.role === 'admin') && (
                        <div className="col-span-full flex flex-col gap-2 text-white/80">
                            <label
                                htmlFor="branch_id"
                                className="text-sm font-medium"
                            >
                                {t('Sucursal')}
                            </label>
                            <select
                                id="branch_id"
                                value={data.branch_id}
                                onChange={(event) =>
                                    setData(
                                        'branch_id',
                                        Number(event.target.value),
                                    )
                                }
                                className="min-h-11 rounded-lg bg-white px-3 text-black"
                            >
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                            {errors.branch_id && (
                                <p className="text-sm text-red-500">
                                    {errors.branch_id}
                                </p>
                            )}
                        </div>
                    )}

                    <TextField
                        isRequired
                        name="password"
                        type="password"
                        value={data.password}
                        onChange={(value) => {
                            setData('password', value);

                            if (errors.password) {
                                clearErrors('password');
                            }
                        }}
                        isInvalid={!!errors.password}
                    >
                        <Label className="text-sm font-medium tracking-tight text-white/80">
                            {t('Contraseña')}{' '}
                        </Label>
                        <Input
                            placeholder={t('Mínimo 8 caracteres')}
                            className="w-full rounded-lg bg-white/5 px-4 py-3 text-white transition-colors duration-150 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-500"
                        />
                        <FieldError className="text-sm font-medium text-red-500">
                            {t(errors.password)}
                        </FieldError>
                    </TextField>

                    <TextField
                        isRequired
                        name="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(value) => {
                            setData('password_confirmation', value);

                            if (errors.password_confirmation) {
                                clearErrors('password_confirmation');
                            }
                        }}
                        isInvalid={!!errors.password_confirmation}
                    >
                        <Label className="text-sm font-medium tracking-tight text-white/80">
                            {t('Confirmar contraseña')}{' '}
                        </Label>
                        <Input
                            placeholder={t('Repite la contraseña')}
                            className="w-full rounded-lg bg-white/5 px-4 py-3 text-white transition-colors duration-150 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-500"
                        />
                        <FieldError className="text-sm font-medium text-red-500">
                            {t(errors.password_confirmation)}
                        </FieldError>
                    </TextField>
                </div>

                <NativeButton
                    type="submit"
                    disabled={processing}
                    className="mt-10 w-full max-w-xs bg-amber-500 py-3.5 text-lg font-semibold tracking-tight text-black transition-transform duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {processing ? t('Creando…') : t('Crear Empleado')}
                </NativeButton>
            </Form>
        </FormLayout>
    );
}
