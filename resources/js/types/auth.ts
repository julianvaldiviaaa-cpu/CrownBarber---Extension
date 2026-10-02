import type { NotificationItem } from './index';

export type User = {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'user' | 'worker' | 'admin';
    branch_id: number | null;
    avatar?: string;
    profile_photo_url: string;
    cover_photo_url: string;
    specialty: string | null;
    email_verified_at: string | null;
    notification_sound: boolean;
    notification_prompted_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
};

export type Auth = {
    user: User;
    pushPublicKey: string | null;
    pushEnabled: boolean;
    notifications?: NotificationItem[];
    unreadNotificationsCount?: number;
};
