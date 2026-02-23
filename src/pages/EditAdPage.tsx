import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from '../components/post-ad/ImageUploader';
import DynamicAdForm from '../components/post-ad/DynamicAdForm';
import Layout from '../components/layout/Layout';
import { Store, Building2, Warehouse, Home, MapPin, Car, Settings, Smartphone, Sofa, Briefcase, Phone as PhoneIcon, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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

const EditAdPage: React.FC = () => {
  const { adId } = useParams<{ adId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
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
  const [fetchingAd, setFetchingAd] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(true);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

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

  useEffect(() => {
    const fetchAdData = async () => {
      if (!adId || !user) return;
      
      try {
        setFetchingAd(true);
        // Fetch ad
        const { data: ad, error: adError } = await supabase
          .from('ads')
          .select('*, categories(slug)')
          .eq('id', adId)
          .single();
        
        if (adError || !ad) throw adError || new Error('آگهی یافت نشد');
        
        // Check ownership
        if (ad.user_id !== user.id) {
          toast({
            title: "عدم دسترسی",
            description: "شما اجازه ویرایش این آگهی را ندارید.",
            variant: "destructive",
          });
          navigate('/my-ads');
          return;
        }

        // Fetch ad details
        const { data: details } = await supabase
          .from('ad_details')
          .select('features')
          .eq('ad_id', adId)
          .maybeSingle();

        const features = (details?.features as any) || {};
        
        setCategory(ad.categories?.slug || '');
        setBasicData({
          title: ad.title || '',
          description: ad.description || '',
          images: ad.images || [],
          location: ad.location || '',
          phone: ad.phone || '',
        });
        setImageUrls(ad.images || []);
        setPreviewImages(ad.images || []);
        setShowPhone(features.show_phone !== false && features.show_phone !== 'false');
        
        setDynamicData({
          ...features,
          price: ad.price,
          location: ad.location,
          phone: ad.phone,
        });

      } catch (err: any) {
        console.error('Error fetching ad data:', err);
        toast({
          title: "خطا",
          description: "خطا در بارگذاری اطلاعات آگهی.",
          variant: "destructive",
        });
        navigate('/my-ads');
      } finally {
        setFetchingAd(false);
      }
    };

    if (!loading && user) {
      fetchAdData();
    } else if (!loading && !user) {
      navigate('/login');
    }
  }, [adId, user, loading, navigate, toast]);

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
        return <Home className="w-5 h-5 middle" />;
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

  const handleUpdateAd = async () => {
    setSubmitError(null);
    setSubmitting(true);

    if (!basicData.title || !basicData.description) {
      setSubmitError('لطفاً عنوان و توضیحات آگهی را وارد کنید.');
      setSubmitting(false);
      return;
    }

    if (imageUrls.length === 0) {
      setSubmitError('لطفاً حداقل یک تصویر برای آگهی خود انتخاب کنید.');
      setSubmitting(false);
      return;
    }

    try {
      const { price, location, phone, show_phone, ...otherFeatures } = dynamicData;

      const adUpdateData = {
        title: basicData.title,
        description: basicData.description,
        price: price ? Number(price) : null,
        location: location || basicData.location || null,
        phone: user?.phone || phone || basicData.phone || null,
        images: imageUrls,
        status: 'pending', // تغییر وضعیت به در انتظار تایید پس از ویرایش
        updated_at: new Date().toISOString()
      };

      const { error: updateAdError } = await supabase
        .from('ads')
        .update(adUpdateData)
        .eq('id', adId);

      if (updateAdError) throw updateAdError;

      // Update or Insert details
      const { data: existingDetails } = await supabase
        .from('ad_details')
        .select('id')
        .eq('ad_id', adId)
        .maybeSingle();

      if (existingDetails) {
        const { error: detailsError } = await supabase
          .from('ad_details')
          .update({
            features: {
              ...otherFeatures,
              show_phone: !!showPhone
            }
          })
          .eq('ad_id', adId);
        
        if (detailsError && (detailsError as any).status !== 404) {
          console.error('Error updating ad_details:', detailsError);
        }
      } else {
        const { error: detailsError } = await supabase
          .from('ad_details')
          .insert({
            ad_id: adId,
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
        title: "آگهی با موفقیت ویرایش شد",
        description: "تغییرات شما پس از تایید دوباره توسط مدیر منتشر خواهد شد.",
      });
      navigate('/my-ads');
    } catch (err: any) {
      console.error('Error updating ad:', err);
      setSubmitError(err.message || 'خطا در ویرایش آگهی.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || fetchingAd) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-gray-500">در حال بارگذاری اطلاعات...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-20 max-w-4xl text-right" dir="rtl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">خانه</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/my-ads">آگهی‌های من</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>ویرایش آگهی</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-right">ویرایش آگهی</h1>
          <p className="text-gray-600 text-right">
            اطلاعات آگهی خود را ویرایش کنید. پس از ویرایش، آگهی دوباره باید توسط مدیر تایید شود.
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">
            {/* آپلود تصاویر */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-right">تصاویر آگهی <span className="text-red-500">*</span></h2>
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
              <h2 className="text-xl font-bold border-r-4 border-primary pr-3 text-right">مشخصات اصلی</h2>

              <div className="space-y-2">
                <label className="font-bold text-gray-700 block text-right">عنوان آگهی <span className="text-red-500">*</span></label>
                <Input
                  placeholder="مثال: آپارتمان ۸۵ متری خوش نقشه"
                  value={basicData.title}
                  onChange={e => setBasicData(prev => ({ ...prev, title: e.target.value }))}
                  className="h-12 text-lg text-right"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-gray-700 block text-right">توضیحات آگهی <span className="text-red-500">*</span></label>
                <Textarea
                  placeholder="جزئیات و ویژگی‌های آگهی خود را بنویسید..."
                  value={basicData.description}
                  onChange={e => setBasicData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[150px] text-lg leading-relaxed text-right"
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
                    <div className="font-bold text-lg tracking-wider" dir="ltr">{user?.phone || 'ثبت نشده'}</div>
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
            </section>

            {/* فیلد های داینامیک و قیمت */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold border-r-4 border-primary pr-3 text-right">جزئیات و قیمت</h2>
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
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-right">
                <span className="text-xl">⚠️</span>
                {submitError}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/my-ads')}
                className="flex-1 h-14 text-xl font-bold rounded-xl"
              >
                انصراف
              </Button>
              <Button
                onClick={handleUpdateAd}
                disabled={submitting || uploading}
                className="flex-[2] h-14 text-xl font-bold rounded-xl"
                size="lg"
              >
                {submitting ? 'در حال ثبت تغییرات...' : 'ذخیره تغییرات'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditAdPage;
