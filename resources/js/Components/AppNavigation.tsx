import { usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Clock,
    Gift,
    LayoutDashboard,
    Scissors,
    UserRound,
    Users,
} from 'lucide-react';
import { DiscreteNavigation } from '@/Components/Watermelon';
import { useTranslation } from '@/lib/i18n';
import {
    appointments,
    businessHours,
    dashboard,
    loyalty,
    profile,
    services,
    workers,
} from '@/routes';

export default function AppNavigation() {
    const { t } = useTranslation();

    const { url, props } = usePage();
    const role = props.auth?.user?.role;
    const path = url.split('?')[0];
    const links = [
        {
            label: t('Inicio'),
            href: dashboard.url(),
            icon: <LayoutDashboard size={16} />,
        },
        {
            label: t('Citas'),
            href: appointments.url(),
            icon: <CalendarDays size={16} />,
        },
        ...(role === 'user'
            ? [
                  {
                      label: t('Mi fidelidad'),
                      href: loyalty.url(),
                      icon: <Gift size={16} />,
                  },
              ]
            : []),
        ...(role === 'admin'
            ? [
                  {
                      label: t('Servicios'),
                      href: services.url(),
                      icon: <Scissors size={16} />,
                  },
                  {
                      label: t('Equipo'),
                      href: workers.url(),
                      icon: <Users size={16} />,
                  },
                  {
                      label: t('Horarios'),
                      href: businessHours.url(),
                      icon: <Clock size={16} />,
                  },
              ]
            : []),
        {
            label: t('Mi cuenta'),
            href: profile.url(),
            icon: <UserRound size={16} />,
        },
    ];

    return (
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-0">
            <DiscreteNavigation
                items={links.map((item) => ({
                    ...item,
                    active:
                        item.href === dashboard.url()
                            ? path === item.href
                            : path.startsWith(item.href),
                }))}
            />
        </div>
    );
}
