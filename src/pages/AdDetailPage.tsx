import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, Heart } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Layout from '../components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ChatModule from '../components/chat/ChatModule';
import { useToast } from '@/components/ui/use-toast';
import { useFavorites } from '@/hooks/useFavorites';
import AdDetailGallery from '../components/ui/AdDetailGallery';

// پیام به فروشنده - ساختار جدول پیشنهادی در Supabase:
//
// create table public.messages (
//   id uuid primary key default uuid_generate_v4(),
//   ad_id uuid not null,
//   sender_id uuid not null,
//   receiver_id uuid not null,
//   content text not null,
//   created_at timestamp with time zone default now()
// );
//
// اگر ad_id از نوع int است، نوع آن را به int تغییر دهید.
//
// ---

interface AdDetail {
  id: number;
  title: string;
  description: string;
  price: string;
  location: string;
  images: string[];
  date: string;
  sellerName: string;
  sellerJoined: string;
  features: Record<string, string>;
  sellerId?: string; // اضافه شد
}

const AdDetailPage: React.FC = () => {
  const { adId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ad, setAd] = React.useState<AdDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [showMessageModal, setShowMessageModal] = React.useState(false);
  const [messageText, setMessageText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [messageSuccess, setMessageSuccess] = React.useState(false);
  const [messageError, setMessageError] = React.useState('');
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [userNote, setUserNote] = useState('');

  // Load user note from localStorage
  useEffect(() => {
    if (user && adId) {
      const note = localStorage.getItem(`note_${user.id}_${adId}`) || '';
      setUserNote(note);
    }
  }, [user, adId]);

  // Save user note to localStorage
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserNote(e.target.value);
    if (user && adId) {
      localStorage.setItem(`note_${user.id}_${adId}`, e.target.value);
    }
  };

  React.useEffect(() => {
    const fetchAd = async () => {
      setLoading(true);
      setError(null);
      if (!adId) {
        setError('شناسه آگهی نامعتبر است');
        setLoading(false);
        return;
      }
      // فرض: جدول ads دارای فیلدهای title, description, price, location, images, created_at, user_id است
      const { data, error } = await supabase
        .from('ads')
        .select('id, title, description, price, location, images, created_at, user_id')
        .eq('id', adId)
        .single();
      if (error || !data) {
        setError('آگهی مورد نظر یافت نشد');
        setLoading(false);
        return;
      }
      let sellerName = '---';
      let sellerJoined = '';
      if (data.user_id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name, created_at')
          .eq('id', data.user_id)
          .single();
        if (userData) {
          sellerName = userData.full_name || '---';
          sellerJoined = userData.created_at ? `عضویت از ${new Date(userData.created_at).toLocaleDateString('fa-IR')}` : '';
        }
      }
      const features: Record<string, string> = {};
      setAd({
        id: data.id, // uuid string, not number!
        title: data.title,
        description: data.description,
        price: data.price ? `${Number(data.price).toLocaleString('fa-IR')} تومان` : 'توافقی',
        location: data.location || '---',
        images: Array.isArray(data.images) ? data.images : [],
        date: data.created_at ? new Date(data.created_at).toLocaleDateString('fa-IR') : '',
        sellerName,
        sellerJoined,
        features,
        sellerId: data.user_id, // اضافه شد
      });
      setLoading(false);
    };
    fetchAd();
  }, [adId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500 mb-4">در حال بارگذاری...</p>
        <Navbar />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500 mb-4">{error || 'آگهی مورد نظر یافت نشد'}</p>
        <Link to="/" className="text-primary font-medium">بازگشت به صفحه اصلی</Link>
        <Navbar />
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-2 md:px-4 py-6 pb-20">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-400 mb-2">
          {/* نمونه: املاک > اجاره آپارتمان > شهرک راه آهن */}
          <span>املاک &gt; اجاره آپارتمان &gt; شهرک راه آهن</span>
        </div>
        <div className="grid md:grid-cols-12 gap-6">
          {/* Main/Left Column */}
          <div className="md:col-span-8 w-full">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <AdDetailGallery images={ad.images} title={ad.title} />
              <h1 className="text-2xl font-bold mt-4 mb-2">{ad.title}</h1>
              <div className="flex items-center text-gray-500 text-xs mb-2">
                <span>1 هفته پیش در {ad.location}</span>
              </div>
              <div className="border-b my-4" />
              <h2 className="font-bold mb-2">توضیحات</h2>
              <p className="text-gray-700 leading-relaxed text-sm mb-6">{ad.description}</p>
              {/* User Note */}
              <div className="mb-6">
                <label className="block font-bold mb-1 text-sm">یادداشت شما</label>
                {user ? (
                  <>
                    <textarea
                      className="w-full border rounded p-2 text-sm"
                      rows={3}
                      placeholder="یادداشت شما..."
                      value={userNote}
                      onChange={handleNoteChange}
                    />
                    <div className="text-xs text-gray-400 mt-1">یادداشت فقط برای شما قابل مشاهده است و پس از حذف آگهی پاک خواهد شد.</div>
                  </>
                ) : (
                  <div className="text-xs text-gray-400">برای ثبت یادداشت باید وارد حساب کاربری شوید.</div>
                )}
              </div>
              {/* Report Button */}
              <div className="flex justify-end">
                <button className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 border border-gray-200 rounded px-3 py-1">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  گزارش آگهی
                </button>
              </div>
            </div>
          </div>
          {/* Sidebar/Right Column */}
          <div className="md:col-span-4 w-full">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-gray-800">{ad.price}</span>
                <button className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs flex items-center gap-1">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>
                  نشان کردن
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
                <div>متراژ: <span className="font-bold">45</span></div>
                <div>اتاق: <span className="font-bold">1</span></div>
                <div>طبقه: <span className="font-bold">1</span></div>
                <div>ودیعه: <span className="font-bold">450,000,000 تومان</span></div>
                <div>اجاره: <span className="font-bold">رایگان</span></div>
                <div>قابل تبدیل: <span className="font-bold">خیر</span></div>
                <div>همکف از 3</div>
              </div>
              <div className="flex gap-2 mb-4">
                <button className="flex-1 bg-primary text-white py-2 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 ml-1" />
                  اطلاعات تماس
                </button>
                <button 
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                  onClick={() => setShowChat(true)}
                >
                  <MessageSquare className="w-5 h-5 ml-1" />
                  چت
                </button>
              </div>
              <div className="border-b my-4" />
              <div className="flex gap-4 text-xs text-gray-600 mb-2">
                <div className="flex flex-col items-center">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 12a4 4 0 0 1-8 0"/></svg>
                  آسانسور ندارد
                </div>
                <div className="flex flex-col items-center">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="7" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  پارکینگ
                </div>
              </div>
              <div className="border-b my-4" />
              <div className="mb-2">
                <div className="font-bold text-sm mb-1">فروشنده</div>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-xs">{ad.sellerName}</div>
                    <div className="text-gray-400 text-xs">{ad.sellerJoined}</div>
                  </div>
                </div>
              </div>
              {/* Accordion for more details */}
              <div className="mt-4">
                <details className="mb-2">
                  <summary className="cursor-pointer font-bold text-sm text-primary">نمایش همه جزئیات</summary>
                  <div className="text-xs text-gray-600 mt-2">
                    <div>ارزیابی قیمت: <span className="font-bold">مناسب</span></div>
                    <div>بررسی و کارشناسی: <span className="font-bold">دارد</span></div>
                  </div>
                </details>
                <details>
                  <summary className="cursor-pointer font-bold text-sm text-primary">توضیحات تکمیلی</summary>
                  <div className="text-xs text-gray-600 mt-2">
                    یک واحد سوئیت ۴۵ متری زیر طبقه اول با نورگیر مستقیم. آنتن، واقع در میدان اندیشه. برق، گاز، تلفن، شوفاژ. کد آگهی: ۱۲۳۴۵۶۷۸۹
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Module */}
      {showChat && user && ad && (
        <ChatModule 
          user={user} 
          toast={toast} 
          initialAdId={adId} 
          initialReceiverId={ad.sellerId}
          onClose={() => setShowChat(false)}
        />
      )}
    </Layout>
  );
};

// Adding User icon since it's used in this component
const User = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default AdDetailPage;
