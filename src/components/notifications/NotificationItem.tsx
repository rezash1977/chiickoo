import React from 'react';
import { Notification } from '@/types/notification';
import { cn } from '@/lib/utils';
import { Check, Info, AlertTriangle, XCircle, CheckCircle2, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';

interface NotificationItemProps {
    notification: Notification;
    onRead: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRead }) => {
    const getIcon = () => {
        switch (notification.type) {
            case 'success':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'ad_status':
                return <Bell className="h-5 w-5 text-blue-500" />;
            default:
                return <Info className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div
            className={cn(
                "flex gap-3 p-3 border-b hover:bg-gray-50 transition-colors cursor-pointer",
                !notification.is_read && "bg-blue-50/50"
            )}
            onClick={() => onRead(notification.id)}
        >
            <div className="mt-1 flex-shrink-0">
                {getIcon()}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                    <p className={cn("text-sm font-medium leading-none", !notification.is_read && "text-blue-700")}>
                        {notification.title}
                    </p>
                    {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                    )}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">
                    {notification.message}
                </p>
                <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: faIR })}
                </p>
            </div>
        </div>
    );
};
