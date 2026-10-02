import { router, useForm, usePage } from '@inertiajs/react';
import { index as appointmentsIndex } from '@/actions/App/Http/Controllers/AppointmentsController';
import { index as dashboardIndex } from '@/actions/App/Http/Controllers/DashboardController';
import { NativeButton, NativeInput } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';

export type AppointmentFilterValues = {
    period?: string;
    date_from?: string;
    date_to?: string;
    time_from?: string;
    time_to?: string;
};

export default function AppointmentFilters() {
    const { t } = useTranslation();

    const page = usePage();
    const filters = (page.props.filters ?? {}) as AppointmentFilterValues;
    const form = useForm({
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        time_from: filters.time_from ?? '',
        time_to: filters.time_to ?? '',
    });
    const url =
        page.component === 'Dashboard/Dashboard'
            ? dashboardIndex.url()
            : appointmentsIndex.url();
    const quickFilter = (period: string) =>
        router.get(
            url,
            period
                ? {
                      period,
                      time_from: form.data.time_from,
                      time_to: form.data.time_to,
                  }
                : {},
            { preserveScroll: true },
        );

    return (
        <section
            aria-label={t('Filtrar citas')}
            className="mb-6 rounded-2xl border border-gray-200 bg-white p-5"
        >
            <div className="mb-4 flex flex-wrap gap-2">
                {(
                    [
                        ['', t('Todas')],
                        ['today', t('Hoy')],
                        ['week', t('Esta semana')],
                        ['month', t('Este mes')],
                    ] as const
                ).map(([period, label]) => (
                    <NativeButton
                        key={period}
                        type="button"
                        aria-pressed={
                            (filters.period ?? '') === period &&
                            (period !== '' ||
                                !Object.values(filters).some(Boolean))
                        }
                        onClick={() => quickFilter(period)}
                        className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold aria-pressed:bg-black aria-pressed:text-white"
                    >
                        {label}
                    </NativeButton>
                ))}
            </div>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.get(url, { preserveScroll: true });
                }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
                {(
                    [
                        ['date_from', t('Desde el día'), 'date'],
                        ['date_to', t('Hasta el día'), 'date'],
                        ['time_from', t('Desde las'), 'time'],
                        ['time_to', t('Hasta las'), 'time'],
                    ] as const
                ).map(([name, label, type]) => (
                    <label
                        key={name}
                        className="flex min-w-0 flex-col gap-1 text-sm font-medium"
                    >
                        {label}
                        <NativeInput
                            type={type}
                            value={form.data[name]}
                            onChange={(event) =>
                                form.setData(name, event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black"
                        />
                        {form.errors[name] && (
                            <span role="alert" className="text-xs text-red-600">
                                {t(form.errors[name])}
                            </span>
                        )}
                    </label>
                ))}
                <NativeButton
                    disabled={form.processing}
                    className="self-end rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {t('Aplicar filtros')}{' '}
                </NativeButton>
            </form>
            <p className="mt-3 text-xs text-black/50">
                {t(
                    'Horario de la barbería. La semana va de lunes a domingo. Se filtra por la fecha y hora reservadas.',
                )}{' '}
            </p>
        </section>
    );
}
