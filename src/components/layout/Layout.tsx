
import React, { useState } from 'react';
import Header from './Header';
import Navbar from './Navbar';
import { NotificationSystem } from '@/components/ui/notification-system';
import { renewAd } from '@/hooks/useAds';
import { useToast } from '@/hooks/use-toast';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [renewingAds, setRenewingAds] = useState<Set<string>>(new Set());

  const handleRenewAd = async (adId: string) => {
    setRenewingAds(prev => new Set(prev).add(adId));
    
    try {
      await renewAd(adId);
      toast({
        title: "آگهی تمدید شد",
        description: "آگهی شما با موفقیت تمدید شد و دوباره فعال است.",
      });
    } catch (error) {
      toast({
        title: "خطا در تمدید آگهی",
        description: "متأسفانه در تمدید آگهی مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setRenewingAds(prev => {
        const newSet = new Set(prev);
        newSet.delete(adId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50">
        {children}
      </main>
      {/* <Navbar /> */}
      <Navbar />
      
      {/* Global Notification System */}
      <NotificationSystem
        onRenewAd={handleRenewAd}
        renewingAds={renewingAds}
      />
    </div>
  );
};

export default Layout;
