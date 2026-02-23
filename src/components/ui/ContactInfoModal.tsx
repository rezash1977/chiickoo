import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Phone, User, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  adTitle: string;
  adId?: string;
}

interface UserInfo {
  email?: string;
  phone?: string;
  full_name?: string;
  showPhone?: boolean;
}

const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  isOpen,
  onClose,
  userId,
  adTitle,
  adId
}) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserInfo();
    }
  }, [isOpen, userId, adId]);

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', userId)
        .single();

      let showPhone = true;
      if (adId) {
        const { data: adDetails } = await supabase
          .from('ad_details')
          .select('features')
          .eq('ad_id', adId)
          .maybeSingle();
        
        if (adDetails?.features && typeof adDetails.features === 'object') {
          const features = adDetails.features as Record<string, any>;
          if (features.show_phone === false || features.show_phone === 'false') {
            showPhone = false;
          }
        }
      }

      const userInfo: UserInfo = {
        email: '', // Don't show email if we don't have it or for privacy
        phone: showPhone ? (profileData?.phone || undefined) : undefined,
        full_name: profileData?.full_name || undefined,
        showPhone
      };

      setUserInfo(userInfo);
    } catch (error) {
      console.error('Error fetching user info:', error);
      toast({
        title: 'خطا در دریافت اطلاعات تماس',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({
        title: 'کپی شد',
        description: `${type} در کلیپبورد کپی شد`
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({
        title: 'خطا در کپی',
        description: `امکان کپی ${type} وجود ندارد`
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">
            اطلاعات تماس - {adTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          ) : userInfo ? (
            <>
              {userInfo.full_name && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">نام</p>
                    <p className="font-medium">{userInfo.full_name}</p>
                  </div>
                </div>
              )}

              {userInfo.email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">ایمیل</p>
                    <p className="font-medium">{userInfo.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(userInfo.email!, 'ایمیل')}
                    className="flex items-center gap-1"
                  >
                    {copied === 'ایمیل' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}

              {userInfo.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">تلفن</p>
                    <p className="font-medium">{userInfo.phone}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(userInfo.phone!, 'تلفن')}
                    className="flex items-center gap-1"
                  >
                    {copied === 'تلفن' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}

              {!userInfo.phone && (
                <div className="text-center py-8">
                  <p className="text-gray-500">اطلاعات تماس توسط فروشنده مخفی شده است یا در دسترس نیست</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">خطا در دریافت اطلاعات</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            بستن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactInfoModal;
