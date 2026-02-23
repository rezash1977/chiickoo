import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SimpleAdForm from '../components/post-ad/SimpleAdForm';
import ImageUploader from '../components/post-ad/ImageUploader';
import DynamicAdForm from '../components/post-ad/DynamicAdForm';
import Layout from '../components/layout/Layout';
import { Store, Building2, Warehouse, Home, MapPin, Car, Settings, Smartphone, Sofa, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Phone as PhoneIcon, ChevronLeft } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

// تابع آپلود تصویر به Supabase Storage
const uploadImageToSupabase = async (file: File): Promise<string> => {
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('pic')
    .upload(fileName, file);

  if (error) {
    throw new Error(`خطا در آپلود تصویر: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('pic')
    .getPublicUrl(fileName);

  return publicUrl;
};

const PostAdPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [basicData, setBasicData] = useState({
    title: '',
    description: '',
    images: [] as string[],
    location: '',
    phone: '',
  });
  const [dynamicData, setDynamicData] = useState<any>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(true);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(true);

  // دریافت همه دسته‌بندی‌ها
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        if (error) throw error;
        setAllCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'shop_rent':
      case 'shop_sale':
      case 'shop':
        return <Store className="w-5 h-5" />;
      case 'office_rent':
      case 'office':
        return <Building2 className="w-5 h-5" />;
      case 'industrial':
        return <Warehouse className="w-5 h-5" />;
      case 'apartment_rent':
      case 'apartment_sale':
      case 'apartment':
        return <Home className="w-5 h-5" />;
      case 'villa_rent':
      case 'villa_sale':
      case 'villa':
        return <Building2 className="w-5 h-5" />;
      case 'land':
        return <MapPin className="w-5 h-5" />;
      case 'cars':
        return <Car className="w-5 h-5" />;
      case 'services':
        return <Settings className="w-5 h-5" />;
      case 'electronics':
        return <Smartphone className="w-5 h-5" />;
      case 'furniture':
        return <Sofa className="w-5 h-5" />;
      case 'jobs':
        return <Briefcase className="w-5 h-5" />;
      case 'realestate':
        return <Home className="w-5 h-5" />;
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

  const handleImageUpload = async (files: File[]) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadImageToSupabase(file);
        urls.push(url);
      }
      setImageUrls(prev => [...prev, ...urls]);
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

  const handleCategorySelect = (slug: string) => {
    setCategory(slug);
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSubmitAd = async () => {
    setSubmitError(null);
    setSubmitting(true);

    // Validation
    if (!category) {
      setSubmitError('لطفاً دسته‌بندی را انتخاب کنید.');
      setSubmitting(false);
      return;
    }

    if (!basicData.title || !basicData.description) {
      setSubmitError('لطفاً عنوان و توضیحات آگهی را وارد کنید.');
      setSubmitting(false);
      return;
    }

    // Check for price in dynamicData (mapping to price field in ads table)
    const price = dynamicData.price || null;
    if (!price && !['land'].includes(category)) { // Example: price might be optional for land or handled differently, but generally it's required for others
      // In our app, price is required in DynamicAdForm config, so we should check it
      if (!dynamicData.price) {
        setSubmitError('لطفاً قیمت آگهی را وارد کنید.');
        setSubmitting(false);
        return;
      }
    }

    if (imageUrls.length === 0) {
      setSubmitError('لطفاً حداقل یک تصویر برای آگهی خود انتخاب کنید.');
      setSubmitting(false);
      return;
    }

    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();

      if (categoryError || !categoryData?.id) {
        throw new Error('دسته‌بندی یافت نشد.');
      }

      const { price, location, phone, show_phone, ...otherFeatures } = dynamicData;

      const adData = {
        title: basicData.title,
        description: basicData.description,
        price: price ? Number(price) : null,
        location: location || basicData.location || null,
        phone: user.phone || phone || basicData.phone || null,
        images: imageUrls,
        category_id: categoryData.id,
        user_id: user.id,
        status: 'pending'
      };

      const { data: insertedAd, error: insertAdError } = await supabase
        .from('ads')
        .insert(adData)
        .select()
        .single();

      if (insertAdError) throw insertAdError;

      if (insertedAd) {
        const { error: detailsError } = await supabase
          .from('ad_details')
          .insert({
            ad_id: insertedAd.id,
            features: {
              ...otherFeatures,
              show_phone: !!showPhone
            }
          });
        
        if (detailsError && (detailsError as any).status !== 404) {
          console.error('Error inserting ad_details:', detailsError);
        }
      }

      toast({
        title: "آگهی با موفقیت ثبت شد",
        description: "آگهی شما پس از تایید مدیر منتشر خواهد شد.",
      });
      navigate('/my-ads');
    } catch (err: any) {
      console.error('Error creating ad:', err);
      setSubmitError(err.message || 'خطا در ثبت آگهی.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-20 max-w-4xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">خانه</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>ثبت آگهی جدید</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">ثبت آگهی جدید</h1>
          <p className="text-gray-600">
            {step === 1 ? 'ابتدا دسته‌بندی آگهی خود را انتخاب کنید' : 'مشخصات آگهی را با دقت تکمیل کنید'}
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {allCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className="bg-white p-6 rounded-2xl border-2 border-transparent shadow-sm hover:shadow-md hover:border-primary/20 cursor-pointer transition-all flex flex-col items-center gap-4 text-center group"
                >
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-50 rounded-2xl group-hover:bg-primary/5 transition-colors">
                    <div className="text-gray-600 group-hover:text-primary transition-colors transform group-hover:scale-110 duration-300">
                      {React.cloneElement(getCategoryIcon(cat.slug) as React.ReactElement, { size: 32, className: "w-8 h-8" })}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">ثبت در {cat.name}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-primary/5 rounded-2xl p-8 text-center border border-primary/10">
              <h3 className="font-bold text-gray-700 mb-2">راهنمای ثبت آگهی</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-lg mx-auto">
                لطفاً ابتدا دسته‌بندی دقیق کالای خود را انتخاب کنید تا فیلدهای مربوطه برای شما نمایش داده شود. ثبت آگهی در دسته‌بندی اشتباه باعث عدم تایید آن خواهد شد.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => { setStep(1); setCategory(''); }}
              className="text-primary flex items-center gap-1 font-medium mb-4"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              تغییر دسته‌بندی ({allCategories.find(c => c.slug === category)?.name})
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">
              {/* آپلود تصاویر */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold">تصاویر آگهی <span className="text-red-500">*</span></h2>
                <ImageUploader
                  imageFiles={imageFiles}
                  setImageFiles={setImageFiles}
                  previewImages={previewImages}
                  setPreviewImages={setPreviewImages}
                  uploading={uploading}
                  onUpload={handleImageUpload}
                />
              </section>

              {/* مشخصات اصلی */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold border-r-4 border-primary pr-3">مشخصات اصلی</h2>

                <div className="space-y-2">
                  <label className="font-bold text-gray-700">عنوان آگهی <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="مثال: آپارتمان ۸۵ متری خوش نقشه"
                    value={basicData.title}
                    onChange={e => setBasicData(prev => ({ ...prev, title: e.target.value }))}
                    className="h-12 text-lg"
                  />
                  <p className="text-xs text-gray-500">عنوان نباید شامل قیمت یا شماره تماس باشد.</p>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-gray-700">توضیحات آگهی <span className="text-red-500">*</span></label>
                  <Textarea
                    placeholder="جزئیات و ویژگی‌های آگهی خود را بنویسید..."
                    value={basicData.description}
                    onChange={e => setBasicData(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[150px] text-lg leading-relaxed"
                  />
                </div>
              </section>

              {/* شماره تماس */}
              <section className="space-y-6 text-right">
                <h2 className="text-xl font-bold border-r-4 border-primary pr-3 text-right">اطلاعات تماس</h2>
                <div 
                  className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setShowPhone(!showPhone)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <PhoneIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">شماره تماس تایید شده</div>
                      <div className="font-bold text-lg tracking-wider" dir="ltr">{user.phone || 'ثبت نشده'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      id="showPhone"
                      checked={showPhone}
                      onCheckedChange={(checked) => setShowPhone(!!checked)}
                    />
                    <Label htmlFor="showPhone" className="text-sm font-medium cursor-pointer">نمایش شماره در آگهی</Label>
                  </div>
                </div>
                {!user.phone && (
                  <p className="text-xs text-red-500">هشدار: شماره تماس شما در سیستم ثبت نشده است. لطفاً از طریق پروفایل شماره خود را تایید کنید.</p>
                )}
              </section>

              {/* فیلد های داینامیک و قیمت */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold border-r-4 border-primary pr-3">جزئیات و قیمت</h2>
                <DynamicAdForm
                  formData={dynamicData}
                  updateFormData={setDynamicData}
                  onSubmit={() => { }}
                  submitting={submitting}
                  uploading={uploading}
                  category={category}
                  showCategorySelector={false}
                  showSubmitButton={false}
                />
              </section>

              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                  <span className="text-xl">⚠️</span>
                  {submitError}
                </div>
              )}

              <Button
                onClick={handleSubmitAd}
                disabled={submitting || uploading}
                className="w-full h-14 text-xl font-bold rounded-xl"
                size="lg"
              >
                {submitting ? 'در حال ثبت آگهی...' : 'انتشار آگهی'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};


export default PostAdPage;

