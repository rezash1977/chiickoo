export interface Notification {
    id: string;
    user_id: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'ad_status' | 'system';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    data?: Record<string, any> | null;
}
