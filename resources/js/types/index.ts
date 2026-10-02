export type * from './auth';

export type WorkerProfile = {
    id: number;
    branch_id?: number | null;
    name: string;
    specialty: string | null;
    description: string | null;
    profile_photo_url: string;
    cover_photo_url: string;
    gallery: { id: string; url: string }[];
};

export type Flash = {
    success: string | null;
    error: string | null;
};

export type Paginated<T> = {
    current_page: number;
    data: T[];
    first_page_url: string | null;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
};

export type Service = {
    id: number;
    name: string;
    description: string;
    price: number;
    duration: number;
    active: boolean;
    slug: string;
    loyalty_reward_type: 'haircut' | 'facial' | null;
};

export type AdminDashboardStats = {
    services: number;
    workers: number;
};

export type AppointmentStatus =
    'pending' | 'proposed' | 'confirmed' | 'cancelled' | 'completed';

export type AppointmentUser = {
    id: number;
    name: string;
    phone?: string;
    email?: string;
};

export type AppointmentServicePivot = {
    appointment_id: number;
    service_id: number;
    price: string;
    name: string;
};

export type Appointment = {
    id: number;
    branch_id: number | null;
    branch?: { id: number; name: string; address: string | null } | null;
    user_id: number;
    worker_id: number;
    starts_at: string;
    status: AppointmentStatus;
    total_price: number | string;
    total_duration: number;
    proposed_starts_at: string | null;
    proposed_by: number | null;
    cancelled_by: number | null;
    created_at: string;
    completed_at: string | null;
    loyalty_visit_date: string | null;
    loyalty_reward_service_id: number | null;
    loyalty_reward_name: string | null;
    loyalty_discount: string;
    user?: AppointmentUser;
    worker?: AppointmentUser;
    proposer?: AppointmentUser | null;
    canceller?: AppointmentUser | null;
    services?: Array<Service & { pivot: AppointmentServicePivot }>;
};

export type NotificationItem = {
    id: string;
    data: {
        appointment_id: number;
        type: 'new' | 'proposed' | 'confirmed' | 'cancelled';
        message: string;
        title?: string;
        client_name?: string;
        worker_name?: string;
        services?: string[];
        total_price?: string;
        total_duration?: number;
        starts_at: string | null;
        actor_name: string | null;
        url: string;
    };
    read_at: string | null;
    created_at: string;
};

export type BusinessHour = {
    id: number;
    day_of_week: number;
    open_time: string;
    close_time: string;
    active: boolean;
};

export type BusinessHourOverride = {
    id: number;
    date: string;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
};

export type BusinessHoursPayload = {
    weekly: BusinessHour[];
    overrides: BusinessHourOverride[];
};

export type Loyalty = {
    stamps: number;
    target: number;
    rewards_available: number;
    rewards_redeemed: number;
    visits: number;
};
