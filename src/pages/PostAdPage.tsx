import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SimpleAdForm from '../components/post-ad/SimpleAdForm';
import ImageUploader from '../components/post-ad/ImageUploader';
import DynamicAdForm from '../components/post-ad/DynamicAdForm';
import CategorySelector from '../components/post-ad/CategorySelector';
import { AdFormData } from '@/types/ad';
import Layout from '../components/layout/Layout';
import { Store, Building2, Warehouse, Home, MapPin } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vc3Vqam1sZndlbWFhYW5ocmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzI4MTksImV4cCI6MjA2Mzc0ODgxOX0.vegUrqTj6ou1PKf6Jq6xehaFMuya1j9XKPRJbF2WZj4';
const SUPABASE_URL = 'https://mosujjmlfwemaaanhrcm.supabase.co';

// تابع آپلود تصویر به Supabase Storage
const uploadImageToSupabase = async (file: File): Promise<string> => {
  const filePath = `uploads/${Date.now()}_${file.name}`;
  const bucket = 'pic';

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type,
      },
      body: file,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`خطا در آپلود تصویر: ${errorText}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
};

const PostAdPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [basicData, setBasicData] = useState({
    title: '',
    description: '',
    images: [],
    price: '',
    location: '',
    phone: '',
  });
  const [category, setCategory] = useState('');
  const [dynamicData, setDynamicData] = useState({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [basicTouched, setBasicTouched] = useState<{ title?: boolean; description?: boolean }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const [basicError, setBasicError] = useState<string | null>(null);
  const [imageTouched, setImageTouched] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<Category[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // الگوریتم پیشنهاد دسته‌بندی بر اساس عنوان
  const categoryKeywords = [
    { slug: 'shop_rent', keywords: ['اجاره', 'مغازه', 'غرفه', 'دکان'] },
    { slug: 'shop_sale', keywords: ['فروش', 'مغازه', 'غرفه', 'دکان'] },
    { slug: 'office_rent', keywords: ['اجاره', 'دفتر', 'اداری', 'مطب', 'اتاق کار', 'کلینیک'] },
    { slug: 'industrial', keywords: ['صنعتی', 'کشاورزی', 'تجاری', 'کارخانه'] },
    { slug: 'apartment_rent', keywords: ['اجاره', 'آپارتمان', 'سوئیت'] },
    { slug: 'apartment_sale', keywords: ['فروش', 'آپارتمان', 'سوئیت'] },
    { slug: 'villa_rent', keywords: ['اجاره', 'ویلا', 'خانه', 'خانه ویلایی'] },
    { slug: 'villa_sale', keywords: ['فروش', 'ویلا', 'خانه', 'خانه ویلایی'] },
    { slug: 'land', keywords: ['زمین', 'پارکینگ', 'انباری'] },
  ];

  const suggestCategories = (title: string) => {
    if (!title) return [];
    const lower = title.toLowerCase();
    return categoryKeywords
      .filter(cat => cat.keywords.some(k => lower.includes(k)))
      .map(cat => cat.slug);
  };

  // دریافت همه دسته‌بندی‌ها از سرور
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }
        
        setAllCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
  }, []);

  // پیشنهاد دسته‌بندی بر اساس عنوان
  useEffect(() => {
    if (!basicData.title || !basicData.description || !allCategories.length) return;
    
    // استفاده از مدل ML برای پیشنهاد دسته‌بندی
    const predictCategory = async () => {
      try {
        console.log('Sending request to ML API...');
        const response = await fetch('http://localhost:8000/predict-category', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: basicData.title,
            description: basicData.description
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('ML API response:', result);
          const predictedCategory = result.category;
          
          // پیدا کردن دسته‌بندی پیشنهادی در لیست
          const suggested = allCategories.filter(cat => cat.slug === predictedCategory);
          
          if (suggested.length > 0) {
            setSuggestedCategories(suggested);
          } else {
            // اگر دسته‌بندی پیشنهادی در لیست نبود، همه را نشان بده
            setSuggestedCategories(allCategories);
          }
        } else {
          console.log('ML API failed, using keyword method');
          // در صورت خطا، از روش کلمات کلیدی استفاده کن
          const suggestedSlugs = suggestCategories(basicData.title);
          const suggested = allCategories.filter(cat => suggestedSlugs.includes(cat.slug));
          
          if (suggested.length === 0) {
            setSuggestedCategories(allCategories);
          } else {
            setSuggestedCategories(suggested);
          }
        }
      } catch (error) {
        console.error('Error predicting category:', error);
        console.log('Using keyword method as fallback');
        // در صورت خطا، از روش کلمات کلیدی استفاده کن
        const suggestedSlugs = suggestCategories(basicData.title);
        const suggested = allCategories.filter(cat => suggestedSlugs.includes(cat.slug));
        
        if (suggested.length === 0) {
          setSuggestedCategories(allCategories);
        } else {
          setSuggestedCategories(suggested);
        }
      }
    };
    
    predictCategory();
  }, [basicData.title, basicData.description, allCategories]);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'shop_rent':
      case 'shop_sale':
        return <Store className="w-5 h-5" />;
      case 'office_rent':
        return <Building2 className="w-5 h-5" />;
      case 'industrial':
        return <Warehouse className="w-5 h-5" />;
      case 'apartment_rent':
      case 'apartment_sale':
        return <Home className="w-5 h-5" />;
      case 'villa_rent':
      case 'villa_sale':
        return <Building2 className="w-5 h-5" />;
      case 'land':
        return <MapPin className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const onAdCreated = () => {
    toast({
      title: "آگهی با موفقیت ثبت شد",
      description: "آگهی شما در انتظار تایید ادمین است.",
    });
    navigate('/');
  };

  const handleImageUpload = async (files: File[]) => {
    setUploading(true);
    setImageUrls([]);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadImageToSupabase(file);
        urls.push(url);
      }
      setImageUrls(urls);
      setUploading(false);
    } catch (err: any) {
      setUploading(false);
      toast({
        title: "خطا در آپلود تصویر",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitAd = async () => {
    setSubmitError(null);
    setSubmitting(true);

    // بررسی فیلدهای ضروری
    if (!basicData.title || !category || !basicData.description) {
      setSubmitError('لطفاً تمام فیلدهای ضروری را پر کنید.');
      setSubmitting(false);
      return;
    }

    if (uploading) {
      setSubmitError('لطفاً تا پایان آپلود تصاویر صبر کنید.');
      setSubmitting(false);
      return;
    }

    try {
      // پیدا کردن category_id
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();

      if (categoryError || !categoryData) {
        throw new Error('دسته‌بندی انتخاب شده یافت نشد.');
      }

      // آماده‌سازی تصاویر
      const imagesToSend = imageUrls.length > 0 ? imageUrls : (Array.isArray(basicData.images) ? basicData.images.filter(i => typeof i === 'string') : []);

      // ساخت داده نهایی آگهی
      const adData = {
        title: basicData.title,
        description: basicData.description,
        price: basicData.price ? Number(basicData.price) : null,
        location: basicData.location || null,
        phone: basicData.phone || null,
        images: imagesToSend,
        category_id: categoryData.id,
        user_id: user.id,
        status: 'pending',
        ...dynamicData // فیلدهای داینامیک
      };

      const { error: insertError } = await supabase
        .from('ads')
        .insert([adData]);

      if (insertError) {
        console.error('Error inserting ad:', insertError);
        throw new Error('خطا در ثبت آگهی. لطفاً دوباره تلاش کنید.');
      }

      onAdCreated();
    } catch (err: any) {
      console.error('Error creating ad:', err);
      setSubmitError(err.message);
      toast({
        title: "خطا در ثبت آگهی",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-20 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">ثبت آگهی جدید</h1>
          <p className="text-gray-600">اطلاعات آگهی خود را با دقت پر کنید</p>
        </div>
        {step === 1 && (
          <>
            <div className={imageTouched && imageFiles.length === 0 ? 'border-2 border-red-500 rounded-lg p-2' : ''}>
              <ImageUploader
                imageFiles={imageFiles}
                setImageFiles={setImageFiles}
                previewImages={previewImages}
                setPreviewImages={setPreviewImages}
                uploading={uploading}
                onUpload={handleImageUpload}
              />
            </div>
            <SimpleAdForm
              formData={basicData}
              updateFormData={setBasicData}
              submitting={submitting}
              uploading={uploading}
              touched={basicTouched}
              setTouched={setBasicTouched}
              titleRef={titleRef}
              descRef={descRef}
              error={basicError}
            />
            <div className="flex justify-between mt-6">
              <button
                className="bg-primary text-white px-6 py-2 rounded-lg flex-1"
                onClick={() => {
                  setImageTouched(true);
                  const touched = { title: true, description: true };
                  setBasicTouched(touched);
                  if (imageFiles.length === 0) {
                    setBasicError('لطفاً حداقل یک عکس برای آگهی آپلود کنید.');
                    return;
                  }
                  if (!basicData.title) {
                    setBasicError('لطفاً عنوان آگهی را وارد کنید.');
                    titleRef.current?.focus();
                    return;
                  }
                  if (!basicData.description) {
                    setBasicError('لطفاً توضیحات آگهی را وارد کنید.');
                    descRef.current?.focus();
                    return;
                  }
                  setBasicError(null);
                  setStep(2);
                }}
                disabled={submitting || uploading}
              >
                بعدی
              </button>
            </div>
            {basicError && (
              <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-center">{basicError}</p>
              </div>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">انتخاب دسته آگهی <span className="text-red-500">*</span></h2>
                <p className="text-gray-600">یکی از دسته های زیر را انتخاب کنید.</p>
              </div>
              
              {/* دسته‌بندی‌های پیشنهادی */}
              <div className="space-y-3">
                {(showAllCategories ? allCategories : suggestedCategories).map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.slug)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      category === cat.slug
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                        {getCategoryIcon(cat.slug)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{cat.name}</h3>
                        <p className="text-sm text-gray-500">در دسته املاک</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* دکمه نمایش همه دسته‌ها */}
              {!showAllCategories && (
                <div
                  onClick={() => setShowAllCategories(true)}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">دسته مورد نظرم را پیدا نکردم</h3>
                      <p className="text-sm text-gray-500">نمایش همه دسته های دیوار</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {category && (
              <DynamicAdForm
                formData={dynamicData}
                updateFormData={setDynamicData}
                onSubmit={handleSubmitAd}
                submitting={submitting}
                uploading={uploading}
              />
            )}
            
            <div className="flex justify-between mt-6">
              <button
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg"
                onClick={() => {
                  setStep(1);
                  setCategory('');
                  setDynamicData({});
                  setShowAllCategories(false);
                }}
                disabled={submitting || uploading}
              >
                قبلی
              </button>
              <button
                className="bg-primary text-white px-6 py-2 rounded-lg"
                onClick={handleSubmitAd}
                disabled={submitting || uploading || !category}
              >
                ثبت نهایی
              </button>
            </div>
          </>
        )}
        {submitError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center">{submitError}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PostAdPage;

