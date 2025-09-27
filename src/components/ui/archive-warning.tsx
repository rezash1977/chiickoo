import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { needsArchiveWarning, getDaysUntilArchive } from '@/hooks/useAds';

interface ArchiveWarningProps {
  ads: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
  onRenewAd: (adId: string) => void;
  renewingAds: Set<string>;
}

export const ArchiveWarning: React.FC<ArchiveWarningProps> = ({
  ads,
  onRenewAd,
  renewingAds
}) => {
  const adsNeedingWarning = ads.filter(ad => needsArchiveWarning(ad.created_at));

  if (adsNeedingWarning.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="space-y-2">
          <p className="font-medium">
            ⚠️ هشدار: {adsNeedingWarning.length} آگهی شما به زودی آرشیو خواهد شد
          </p>
          <div className="space-y-1">
            {adsNeedingWarning.map((ad) => {
              const daysUntilArchive = getDaysUntilArchive(ad.created_at);
              return (
                <div key={ad.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{ad.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {daysUntilArchive} روز تا آرشیو
                      </Badge>
                      <span className="text-xs text-orange-600">
                        {new Date(ad.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRenewAd(ad.id)}
                    disabled={renewingAds.has(ad.id)}
                    className="text-green-600 hover:text-green-700 border-green-300"
                  >
                    {renewingAds.has(ad.id) ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    تمدید
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-orange-700 mt-2">
            آگهی‌هایی که بیش از یک ماه از ثبت آنها گذشته باشد به طور خودکار آرشیو می‌شوند. 
            برای جلوگیری از آرشیو شدن، روی دکمه تمدید کلیک کنید.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}; 