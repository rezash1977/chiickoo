import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  Building2, 
  Store, 
  MapPin, 
  Car, 
  Warehouse,
  Bed,
  Bath,
  Square,
  DollarSign,
  Phone,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

interface CategoryField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'price' | 'area' | 'phone';
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  unit?: string;
}

interface DynamicAdFormProps {
  formData: any;
  updateFormData: (data: any) => void;
  onSubmit: () => void;
  submitting: boolean;
  uploading: boolean;
}

// تعریف فیلدهای مختلف برای هر دسته‌بندی
const categoryConfigs: { [key: string]: CategoryField[] } = {
  apartment: [
    { name: 'title', label: 'عنوان آگهی', type: 'text', required: true, placeholder: 'مثال: آپارتمان 2 خوابه در ونک' },
    { name: 'price', label: 'قیمت فروش (تومان)', type: 'price', required: true },
    { name: 'rent', label: 'اجاره ماهانه (تومان)', type: 'price', required: false },
    { name: 'deposit', label: 'ودیعه (تومان)', type: 'price', required: false },
    { name: 'area', label: 'متراژ', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'rooms', label: 'تعداد اتاق خواب', type: 'number', required: true, min: 1, max: 10 },
    { name: 'bathrooms', label: 'تعداد سرویس بهداشتی', type: 'number', required: true, min: 1, max: 5 },
    { name: 'floor', label: 'طبقه', type: 'number', required: false, min: -5, max: 50 },
    { name: 'totalFloors', label: 'تعداد کل طبقات', type: 'number', required: false, min: 1, max: 50 },
    { name: 'age', label: 'سن بنا (سال)', type: 'number', required: false, min: 0, max: 50 },
    { name: 'parking', label: 'پارکینگ', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'elevator', label: 'آسانسور', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'balcony', label: 'بالکن', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'warehouse', label: 'انباری', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'cooling', label: 'سیستم سرمایشی', type: 'select', required: false, options: [
      { value: 'split', label: 'اسپلیت' },
      { value: 'central', label: 'مرکزی' },
      { value: 'none', label: 'ندارد' }
    ]},
    { name: 'heating', label: 'سیستم گرمایشی', type: 'select', required: false, options: [
      { value: 'radiator', label: 'رادیاتور' },
      { value: 'floor', label: 'گرمایش از کف' },
      { value: 'none', label: 'ندارد' }
    ]},
    { name: 'location', label: 'موقعیت مکانی', type: 'text', required: true, placeholder: 'مثال: ونک، خیابان ولیعصر' },
    { name: 'description', label: 'توضیحات', type: 'textarea', required: true, placeholder: 'توضیحات کامل آگهی را اینجا بنویسید...' },
    { name: 'phone', label: 'شماره تماس', type: 'phone', required: true }
  ],
  
  villa: [
    { name: 'title', label: 'عنوان آگهی', type: 'text', required: true, placeholder: 'مثال: ویلا 3 خوابه در لواسان' },
    { name: 'price', label: 'قیمت فروش (تومان)', type: 'price', required: true },
    { name: 'rent', label: 'اجاره ماهانه (تومان)', type: 'price', required: false },
    { name: 'deposit', label: 'ودیعه (تومان)', type: 'price', required: false },
    { name: 'area', label: 'متراژ زمین', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'buildingArea', label: 'متراژ زیربنا', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'rooms', label: 'تعداد اتاق خواب', type: 'number', required: true, min: 1, max: 10 },
    { name: 'bathrooms', label: 'تعداد سرویس بهداشتی', type: 'number', required: true, min: 1, max: 5 },
    { name: 'floors', label: 'تعداد طبقات', type: 'number', required: true, min: 1, max: 5 },
    { name: 'age', label: 'سن بنا (سال)', type: 'number', required: false, min: 0, max: 50 },
    { name: 'parking', label: 'پارکینگ', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'garden', label: 'باغچه', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'pool', label: 'استخر', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'location', label: 'موقعیت مکانی', type: 'text', required: true, placeholder: 'مثال: لواسان، جاده فشم' },
    { name: 'description', label: 'توضیحات', type: 'textarea', required: true, placeholder: 'توضیحات کامل آگهی را اینجا بنویسید...' },
    { name: 'phone', label: 'شماره تماس', type: 'phone', required: true }
  ],
  
  office: [
    { name: 'title', label: 'عنوان آگهی', type: 'text', required: true, placeholder: 'مثال: دفتر اداری در مرکز شهر' },
    { name: 'price', label: 'قیمت فروش (تومان)', type: 'price', required: true },
    { name: 'rent', label: 'اجاره ماهانه (تومان)', type: 'price', required: false },
    { name: 'deposit', label: 'ودیعه (تومان)', type: 'price', required: false },
    { name: 'area', label: 'متراژ', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'rooms', label: 'تعداد اتاق', type: 'number', required: true, min: 1, max: 20 },
    { name: 'floor', label: 'طبقه', type: 'number', required: false, min: -5, max: 50 },
    { name: 'totalFloors', label: 'تعداد کل طبقات', type: 'number', required: false, min: 1, max: 50 },
    { name: 'age', label: 'سن بنا (سال)', type: 'number', required: false, min: 0, max: 50 },
    { name: 'parking', label: 'پارکینگ', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'elevator', label: 'آسانسور', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'security', label: 'نگهبان', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'location', label: 'موقعیت مکانی', type: 'text', required: true, placeholder: 'مثال: مرکز شهر، خیابان ولیعصر' },
    { name: 'description', label: 'توضیحات', type: 'textarea', required: true, placeholder: 'توضیحات کامل آگهی را اینجا بنویسید...' },
    { name: 'phone', label: 'شماره تماس', type: 'phone', required: true }
  ],
  
  shop: [
    { name: 'title', label: 'عنوان آگهی', type: 'text', required: true, placeholder: 'مثال: مغازه در مرکز خرید' },
    { name: 'price', label: 'قیمت فروش (تومان)', type: 'price', required: true },
    { name: 'rent', label: 'اجاره ماهانه (تومان)', type: 'price', required: false },
    { name: 'deposit', label: 'ودیعه (تومان)', type: 'price', required: false },
    { name: 'area', label: 'متراژ', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'floor', label: 'طبقه', type: 'number', required: false, min: -5, max: 10 },
    { name: 'age', label: 'سن بنا (سال)', type: 'number', required: false, min: 0, max: 50 },
    { name: 'parking', label: 'پارکینگ', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'warehouse', label: 'انباری', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'location', label: 'موقعیت مکانی', type: 'text', required: true, placeholder: 'مثال: مرکز خرید، خیابان ولیعصر' },
    { name: 'description', label: 'توضیحات', type: 'textarea', required: true, placeholder: 'توضیحات کامل آگهی را اینجا بنویسید...' },
    { name: 'phone', label: 'شماره تماس', type: 'phone', required: true }
  ],
  
  land: [
    { name: 'title', label: 'عنوان آگهی', type: 'text', required: true, placeholder: 'مثال: زمین مسکونی در لواسان' },
    { name: 'price', label: 'قیمت فروش (تومان)', type: 'price', required: true },
    { name: 'area', label: 'متراژ زمین', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'width', label: 'عرض زمین (متر)', type: 'number', required: false, min: 1, max: 1000 },
    { name: 'length', label: 'طول زمین (متر)', type: 'number', required: false, min: 1, max: 1000 },
    { name: 'usage', label: 'نوع کاربری', type: 'select', required: true, options: [
      { value: 'residential', label: 'مسکونی' },
      { value: 'commercial', label: 'تجاری' },
      { value: 'agricultural', label: 'کشاورزی' },
      { value: 'industrial', label: 'صنعتی' }
    ]},
    { name: 'access', label: 'دسترسی', type: 'select', required: false, options: [
      { value: 'asphalt', label: 'آسفالت' },
      { value: 'dirt', label: 'خاکی' },
      { value: 'none', label: 'ندارد' }
    ]},
    { name: 'water', label: 'آب', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'electricity', label: 'برق', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'gas', label: 'گاز', type: 'select', required: false, options: [
      { value: 'yes', label: 'دارد' },
      { value: 'no', label: 'ندارد' }
    ]},
    { name: 'location', label: 'موقعیت مکانی', type: 'text', required: true, placeholder: 'مثال: لواسان، جاده فشم' },
    { name: 'description', label: 'توضیحات', type: 'textarea', required: true, placeholder: 'توضیحات کامل آگهی را اینجا بنویسید...' },
    { name: 'phone', label: 'شماره تماس', type: 'phone', required: true }
  ]
};

const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case 'apartment': return <Home className="w-5 h-5" />;
    case 'villa': return <Building2 className="w-5 h-5" />;
    case 'office': return <Building2 className="w-5 h-5" />;
    case 'shop': return <Store className="w-5 h-5" />;
    case 'land': return <MapPin className="w-5 h-5" />;
    default: return <Home className="w-5 h-5" />;
  }
};

const getFieldIcon = (type: string) => {
  switch (type) {
    case 'price': return <DollarSign className="w-4 h-4" />;
    case 'area': return <Square className="w-4 h-4" />;
    case 'phone': return <Phone className="w-4 h-4" />;
    case 'text': return <FileText className="w-4 h-4" />;
    case 'textarea': return <FileText className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const DynamicAdForm: React.FC<DynamicAdFormProps> = ({
  formData,
  updateFormData,
  onSubmit,
  submitting,
  uploading
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
          toast({
            title: "خطا در بارگذاری دسته‌بندی‌ها",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        toast({
          title: "خطا در بارگذاری دسته‌بندی‌ها",
          description: "لطفاً صفحه را رفرش کنید",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [toast]);

  const currentFields = formData.category ? categoryConfigs[formData.category] || [] : [];
  
  // Debug: Log current category and fields
  console.log('Current category:', formData.category);
  console.log('Current fields:', currentFields);
  console.log('Available categories:', categories.map(c => c.slug));

  const renderField = (field: CategoryField) => {
    const value = formData[field.name] || '';
    const isRequired = field.required && !value;

    const handleChange = (newValue: string) => {
      updateFormData({ [field.name]: newValue });
    };

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={isRequired ? 'border-red-500' : ''}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className={isRequired ? 'border-red-500' : ''}
          />
        );

      case 'price':
        return (
          <div className="relative">
            <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="number"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="0"
              className={`pr-10 ${isRequired ? 'border-red-500' : ''}`}
            />
          </div>
        );

      case 'area':
        return (
          <div className="relative">
            <Square className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="number"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="0"
              className={`pr-10 ${isRequired ? 'border-red-500' : ''}`}
            />
            {field.unit && (
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                {field.unit}
              </span>
            )}
          </div>
        );

      case 'phone':
        return (
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="tel"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="09123456789"
              className={`pr-10 ${isRequired ? 'border-red-500' : ''}`}
            />
          </div>
        );

      case 'select':
        return (
          <Select value={value} onValueChange={handleChange}>
            <SelectTrigger className={isRequired ? 'border-red-500' : ''}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={isRequired ? 'border-red-500' : ''}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* دسته‌بندی */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            انتخاب دسته‌بندی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => updateFormData({ category: category.slug })}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  formData.category === category.slug
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  {getCategoryIcon(category.slug)}
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* فرم دینامیک */}
      {formData.category && currentFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCategoryIcon(formData.category)}
              اطلاعات {categories.find(c => c.slug === formData.category)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    {getFieldIcon(field.type)}
                    {field.label}
                    {field.required && <Badge variant="destructive" className="text-xs">ضروری</Badge>}
                  </label>
                  {renderField(field)}
                  {field.required && !formData[field.name] && (
                    <p className="text-xs text-red-500">این فیلد الزامی است</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* دکمه ثبت */}
      {formData.category && currentFields.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={onSubmit}
              disabled={submitting || uploading}
              className="w-full"
              size="lg"
            >
              {submitting ? 'در حال ثبت...' : 'ثبت آگهی'}
            </Button>
            {(submitting || uploading) && (
              <p className="text-sm text-gray-500 text-center mt-2">
                لطفاً صبر کنید...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* نمایش خطا اگر دسته‌بندی انتخاب شده اما فیلدها موجود نیستند */}
      {formData.category && currentFields.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p>دسته‌بندی انتخاب شده پیکربندی نشده است.</p>
              <p className="text-sm">لطفاً دسته‌بندی دیگری انتخاب کنید.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DynamicAdForm; 