import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserAdsNeedingWarning } from '@/hooks/useAds';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, X } from 'lucide-react';
import { getDaysUntilArchive } from '@/hooks/useAds';

interface NotificationSystemProps {
  onRenewAd: (adId: string) => void;
  renewingAds: Set<string>;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  onRenewAd,
  renewingAds
}) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(true);
  const { data: adsNeedingWarning } = useUserAdsNeedingWarning(user?.id || '');

  // Hide notifications if user dismisses them
  const handleDismiss = () => {
    setShowNotifications(false);
    // Store dismissal in localStorage to remember user preference
    localStorage.setItem('archive-notifications-dismissed', 'true');
  };

  // Check if user has dismissed notifications
  useEffect(() => {
    const dismissed = localStorage.getItem('archive-notifications-dismissed');
    if (dismissed === 'true') {
      setShowNotifications(false);
    }
  }, []);

  if (!user || !showNotifications || !adsNeedingWarning || adsNeedingWarning.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-orange-200 bg-orange-50 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <Bell className="h-4 w-4 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <AlertDescription className="text-orange-800">
                <div className="space-y-2">
                  <p className="font-medium text-sm">
                    ⚠️ هشدار: {adsNeedingWarning.length} آگهی شما به زودی آرشیو خواهد شد
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {adsNeedingWarning.slice(0, 3).map((ad) => {
                      const daysUntilArchive = getDaysUntilArchive(ad.created_at);
                      return (
                        <div key={ad.id} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{ad.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {daysUntilArchive} روز تا آرشیو
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRenewAd(ad.id)}
                            disabled={renewingAds.has(ad.id)}
                            className="text-green-600 hover:text-green-700 border-green-300 ml-2"
                          >
                            تمدید
                          </Button>
                        </div>
                      );
                    })}
                    {adsNeedingWarning.length > 3 && (
                      <p className="text-xs text-orange-600">
                        و {adsNeedingWarning.length - 3} آگهی دیگر...
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-orange-700 mt-2">
                    برای مشاهده همه آگهی‌ها و تمدید آنها، به صفحه "آگهی‌های من" مراجعه کنید.
                  </p>
                </div>
              </AlertDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-orange-600 hover:text-orange-700 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}; 