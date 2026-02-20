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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
  id: string;
  title: string;
  description: string;
  price: string;
  location: string;
  phone?: string;
  images: string[];
  date: string;
  sellerName: string;
  sellerJoined: string;
  features: Record<string, any>;
  sellerId?: string;
  categoryName?: string;
  categorySlug?: string;
}

const AdDetailPage: React.FC = () => {
  const { adId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [messageError, setMessageError] = useState('');
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [userNote, setUserNote] = useState('');
  const [phoneVisible, setPhoneVisible] = useState(false);

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
      // Fetch ad data with its category
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .select(`
          *,
          categories(name, slug)
        `)
        .eq('id', adId)
        .single();

      if (adError || !adData) {
        console.error('Error fetching ad:', adError);
        setError('آگهی مورد نظر یافت نشد');
        setLoading(false);
        return;
      }

      // Fetch ad features separately since the relationship might not be detected
      const { data: detailsData, error: detailsError } = await supabase
        .from('ad_details')
        .select('features')
        .eq('ad_id', adId)
        .maybeSingle();

      if (detailsError) {
        console.error('Error fetching ad details:', detailsError);
      }

      let sellerName = '---';
      let sellerJoined = '';
      if (adData.user_id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name, created_at')
          .eq('id', adData.user_id)
          .single();
        if (userData) {
          sellerName = userData.full_name || '---';
          sellerJoined = userData.created_at ? `عضویت از ${new Date(userData.created_at).toLocaleDateString('fa-IR')}` : '';
        }
      }

      const features = (detailsData?.features as Record<string, any>) || {};

      setAd({
        id: adData.id,
        title: adData.title,
        description: adData.description,
        price: adData.price ? `${Number(adData.price).toLocaleString('fa-IR')} تومان` : 'توافقی',
        location: adData.location || '---',
        phone: adData.phone || '',
        images: Array.isArray(adData.images) ? adData.images : [],
        date: adData.created_at ? new Date(adData.created_at).toLocaleDateString('fa-IR') : '',
        sellerName,
        sellerJoined,
        features,
        sellerId: adData.user_id,
        categoryName: adData.categories?.name,
        categorySlug: adData.categories?.slug,
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
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">خانه</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {ad.categoryName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/category/${ad.categorySlug}`}>{ad.categoryName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            {ad.location && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="max-w-[100px] truncate text-muted-foreground">{ad.location}</span>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[150px] truncate">{ad.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
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
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" /></svg>
                  نشان کردن
                </button>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-gray-600 mb-6 border-t pt-4">
                {Object.entries(ad.features).map(([key, value]) => {
                  if (['price', 'location', 'phone', 'description', 'title', 'show_phone'].includes(key)) return null;
                  if (value === null || value === undefined || value === '') return null;

                  const labels: Record<string, string> = {
                    area: 'متراژ',
                    rooms: 'تعداد اتاق',
                    floor: 'طبقه',
                    age: 'سن بنا',
                    document_type: 'نوع سند',
                    features: 'امکانات',
                    price_per_meter: 'قیمت هر متر',
                    buildingArea: 'متراژ بنا',
                    height: 'ارتفاع سقف',
                    width: 'بر مغازه',
                    totalFloors: 'تعداد کل طبقات',
                    unitsPerFloor: 'واحد در طبقه',
                    direction: 'جهت ساختمان',
                    floor_covering: 'کفپوش',
                    cabinet: 'کابینت',
                    balcony_area: 'متراژ بالکن',
                    usage: 'کاربری',
                    length: 'طول زمین',
                    brand: 'برند و مدل',
                    year: 'سال تولید',
                    mileage: 'کارکرد (کیلومتر)',
                    color: 'رنگ'
                  };

                  const valueLabels: Record<string, string> = {
                    official: 'سند رسمی تک‌برگ',
                    cooperative: 'سند تعاونی',
                    endowment: 'سند اوقافی',
                    contract: 'قولنامه‌ای',
                    north: 'شمالی',
                    south: 'جنوبی',
                    east: 'شرقی',
                    west: 'غربی',
                    corner: 'دو کله',
                    ceramic: 'سرامیک',
                    parquet: 'پارکت/لمینت',
                    stone: 'سنگ',
                    mosaic: 'موزاییک',
                    mdf: 'MDF',
                    high_gloss: 'High Gloss',
                    membrane: 'Membrane',
                    wood: 'چوبی',
                    metal: 'فلزی',
                    shorayi: 'سند شورایی',
                    official_office: 'سند اداری',
                    official_residential: 'مسکونی (موقعیت اداری)',
                    official_commercial: 'سند تجاری',
                    serghofli: 'سرقفلی',
                    residential: 'مسکونی',
                    commercial: 'تجاری',
                    agricultural: 'کشاورزی',
                    industrial: 'صنعتی',
                    garden: 'باغ',
                    moshaa: 'مشاع',
                    parking: 'پارکینگ',
                    elevator: 'آسانسور',
                    warehouse: 'انباری',
                    balcony: 'بالکن',
                    master_bedroom: 'خواب مستر',
                    lobby: 'لابی',
                    gym: 'سالن ورزشی',
                    pool: 'استخر',
                    sauna: 'سونا',
                    jacuzzi: 'جکوزی',
                    security: 'نگهبانی',
                    water: 'آب',
                    electricity: 'برق',
                    gas: 'گاز',
                    fence: 'دیوارکشی',
                    white: 'سفید',
                    black: 'مشکی',
                    silver: 'نقره‌ای',
                    gray: 'خاکستری',
                    blue: 'آبی',
                    red: 'قرمز'
                  };

                  const formatValue = (val: any, key: string): string => {
                    if (Array.isArray(val)) {
                      return val.map(v => valueLabels[v] || v).join('، ');
                    }
                    const formattedVal = valueLabels[val] || val.toString();

                    if (['area', 'buildingArea', 'balcony_area'].includes(key)) {
                      return `${formattedVal} متر مربع`;
                    }
                    if (key === 'mileage') {
                      return `${formattedVal} کیلومتر`;
                    }
                    if (key === 'age' && val !== '0') {
                      return `${formattedVal} سال`;
                    }
                    if (key === 'age' && val === '0') {
                      return 'نوساز';
                    }
                    return formattedVal;
                  };

                  const displayValue = formatValue(value, key);

                  return (
                    <div key={key} className="flex justify-between border-b border-gray-50 pb-1">
                      <span className="text-gray-400">{labels[key] || key}:</span>
                      <span className="font-bold text-gray-700">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mb-4">
                <button
                  className={`flex-1 ${ad.features?.show_phone === false && !phoneVisible ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary'} text-white py-2 rounded-lg flex items-center justify-center font-bold`}
                  onClick={() => {
                    if (ad.features?.show_phone === false) {
                      toast({
                        title: "اطلاعات تماس محدود شده است",
                        description: "فروشنده نمایش شماره تماس را در این آگهی غیرفعال کرده است. از چت استفاده کنید.",
                        variant: "destructive"
                      });
                      return;
                    }
                    setPhoneVisible(!phoneVisible);
                  }}
                >
                  <Phone className="w-5 h-5 ml-2" />
                  {phoneVisible ? ad.phone : 'اطلاعات تماس'}
                </button>
                <button
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors font-bold"
                  onClick={() => setShowChat(true)}
                >
                  <MessageSquare className="w-5 h-5 ml-2" />
                  چت
                </button>
              </div>
              <div className="border-b my-4" />
              <div className="mb-2">
                <div className="font-bold text-sm mb-2">فروشنده</div>
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
