import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Home,
  Building2,
  Store,
  MapPin,
  Square,
  DollarSign,
  Phone,
  FileText
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
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'price' | 'area' | 'phone' | 'checkbox-group';
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
  category?: string;
  showCategorySelector?: boolean;
  showSubmitButton?: boolean;
}

// تعریف فیلدهای مختلف برای هر دسته‌بندی
const categoryConfigs: { [key: string]: CategoryField[] } = {
  apartment: [
    { name: 'price', label: 'قیمت کل (تومان)', type: 'price', required: true },
    { name: 'price_per_meter', label: 'قیمت هر متر (تومان)', type: 'price', required: false },
    { name: 'area', label: 'متراژ', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'rooms', label: 'تعداد اتاق خواب', type: 'number', required: true, min: 0, max: 10 },
    { name: 'floor', label: 'طبقه', type: 'number', required: true, min: -5, max: 50 },
    { name: 'totalFloors', label: 'تعداد کل طبقات', type: 'number', required: true, min: 1, max: 50 },
    { name: 'unitsPerFloor', label: 'تعداد واحد در طبقه', type: 'number', required: false, min: 1, max: 20 },
    { name: 'age', label: 'سن بنا (سال)', type: 'number', required: true, min: 0, max: 100 },
    {
      name: 'document_type', label: 'نوع سند', type: 'select', required: true, options: [
        { value: 'official', label: 'سند رسمی تک‌برگ' },
        { value: 'cooperative', label: 'سند تعاونی' },
        { value: 'endowment', label: 'سند اوقافی' },
        { value: 'contract', label: 'قولنامه‌ای' }
      ]
    },
    {
      name: 'direction', label: 'جهت ساختمان', type: 'select', required: false, options: [
        { value: 'north', label: 'شمالی' },
        { value: 'south', label: 'جنوبی' },
        { value: 'east', label: 'شرقی' },
        { value: 'west', label: 'غربی' },
        { value: 'corner', label: 'دو کله' }
      ]
    },
    {
      name: 'floor_covering', label: 'کفپوش', type: 'select', required: false, options: [
        { value: 'ceramic', label: 'سرامیک' },
        { value: 'parquet', label: 'پارکت/لمینت' },
        { value: 'stone', label: 'سنگ' },
        { value: 'mosaic', label: 'موزاییک' }
      ]
    },
    {
      name: 'cabinet', label: 'کابینت', type: 'select', required: false, options: [
        { value: 'mdf', label: 'MDF' },
        { value: 'high_gloss', label: 'High Gloss' },
        { value: 'membrane', label: 'Membrane' },
        { value: 'wood', label: 'Wood' },
        { value: 'metal', label: 'فلزی' }
      ]
    },
    {
      name: 'features', label: 'امکانات', type: 'checkbox-group', required: false, options: [
        { value: 'parking', label: 'پارکینگ' },
        { value: 'elevator', label: 'آسانسور' },
        { value: 'warehouse', label: 'انباری' },
        { value: 'balcony', label: 'بالکن' },
        { value: 'master_bedroom', label: 'خواب مستر' },
        { value: 'lobby', label: 'لابی' },
        { value: 'gym', label: 'سالن ورزشی' }
      ]
    },
    { name: 'location', label: 'موقعیت مکانی', type: 'text', required: true, placeholder: 'مثال: تهران، ونک...' },
    { name: 'phone', label: 'شماره تماس', type: 'phone', required: true }
  ],

  villa: [
    { name: 'price', label: 'قیمت کل (تومان)', type: 'price', required: true },
    { name: 'area', label: 'متراژ زمین', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'buildingArea', label: 'متراژ بنا', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'rooms', label: 'تعداد اتاق خواب', type: 'number', required: true, min: 0, max: 20 },
    { name: 'age', label: 'سن بنا (سال)', type: 'number', required: true, min: 0, max: 100 },
    {
      name: 'document_type', label: 'نوع سند', type: 'select', required: true, options: [
        { value: 'official', label: 'سند رسمی تک‌برگ' },
        { value: 'contract', label: 'قولنامه‌ای' },
        { value: 'shorayi', label: 'سند شورای' }
      ]
    },
    {
      name: 'features', label: 'امکانات', type: 'checkbox-group', required: false, options: [
        { value: 'pool', label: 'استخر' },
        { value: 'sauna', label: 'سونا' },
        { value: 'jacuzzi', label: 'جکوزی' },
        { value: 'parking', label: 'پارکینگ' },
        { value: 'warehouse', label: 'انباری' },
        { value: 'balcony', label: 'تراس/بالکن' },
        { value: 'security', label: 'سرایداری/نگهبانی' }
      ]
    },
    { name: 'location', label: 'موقعیت مکانی', type: 'text', required: true },
    { name: 'phone', label: 'شماره تماس', type: 'phone', required: true }
  ],

  office: [
    { name: 'price', label: 'قیمت کل (تومان)', type: 'price', required: true },
    { name: 'area', label: 'متراژ', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'rooms', label: 'تعداد اتاق', type: 'number', required: true, min: 0, max: 20 },
    { name: 'floor', label: 'طبقه', type: 'number', required: true, min: -5, max: 50 },
    { name: 'age', label: 'سن بنا (سال)', type: 'number', required: true, min: 0, max: 100 },
    {
      name: 'document_type', label: 'نوع سند', type: 'select', required: true, options: [
        { value: 'official_office', label: 'سند اداری' },
        { value: 'official_residential', label: 'سند مسکونی (موقعیت اداری)' },
        { value: 'contract', label: 'قولنامه‌ای' }
      ]
    },
    {
      name: 'features', label: 'امکانات', type: 'checkbox-group', required: false, options: [
        { value: 'parking', label: 'پارکینگ' },
        { value: 'elevator', label: 'آسانسور' },
        { value: 'warehouse', label: 'انباری' },
        { value: 'lobby_man', label: 'لابی من' },
        { value: 'security', label: 'نگهبانی' }
      ]
    },
    { name: 'location', label: 'موقعیت مکانی', type: 'text', required: true },
    { name: 'phone', label: 'شماره تماس', type: 'phone', required: true }
  ],

  shop: [
    { name: 'price', label: 'قیمت کل (تومان)', type: 'price', required: true },
    { name: 'area', label: 'متراژ کف', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'balcony_area', label: 'متراژ بالکن', type: 'area', required: false, unit: 'متر مربع' },
    { name: 'height', label: 'ارتفاع سقف (متر)', type: 'number', required: true, min: 2, max: 10 },
    { name: 'width', label: 'بر مغازه (متر)', type: 'number', required: true, min: 1, max: 50 },
    { name: 'age', label: 'سن بنا (سال)', type: 'number', required: true, min: 0, max: 100 },
    {
      name: 'document_type', label: 'نوع سند', type: 'select', required: true, options: [
        { value: 'official_commercial', label: 'سند تجاری' },
        { value: 'serghofli', label: 'سرقفلی' },
        { value: 'contract', label: 'قولنامه‌ای' }
      ]
    },
    { name: 'location', label: 'موقعیت مکانی', type: 'text', required: true },
    { name: 'phone', label: 'شماره تماس', type: 'phone', required: true }
  ],

  land: [
    { name: 'price', label: 'قیمت کل (تومان)', type: 'price', required: true },
    { name: 'area', label: 'متراژ زمین', type: 'area', required: true, unit: 'متر مربع' },
    { name: 'width', label: 'بر زمین (متر)', type: 'number', required: true, min: 1, max: 1000 },
    { name: 'length', label: 'طول زمین (متر)', type: 'number', required: false, min: 1, max: 1000 },
    {
      name: 'usage', label: 'کاربری', type: 'select', required: true, options: [
        { value: 'residential', label: 'مسکونی' },
        { value: 'commercial', label: 'تجاری' },
        { value: 'agricultural', label: 'کشاورزی' },
        { value: 'industrial', label: 'صنعتی' },
        { value: 'garden', label: 'باغ' }
      ]
    },
    {
      name: 'document_type', label: 'نوع سند', type: 'select', required: true, options: [
        { value: 'official', label: 'سند تک‌برگ' },
        { value: 'contract', label: 'قولنامه‌ای' },
        { value: 'shorayi', label: 'سند شورای' },
        { value: 'moshaa', label: 'مشاع' }
      ]
    },
    {
      name: 'features', label: 'امکانات / انشعابات', type: 'checkbox-group', required: false, options: [
        { value: 'water', label: 'آب' },
        { value: 'electricity', label: 'برق' },
        { value: 'gas', label: 'گاز' },
        { value: 'fence', label: 'دیوارکشی/فنس' }
      ]
    },
    { name: 'location', label: 'موقعیت مکانی', type: 'text', required: true },
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
  uploading,
  category,
  showCategorySelector = true,
  showSubmitButton = true
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

  const activeCategory = category || formData.category;
  const currentFields = activeCategory ? categoryConfigs[activeCategory] || [] : [];

  // Debug: Log current category and fields
  console.log('Current category:', activeCategory);
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

      case 'checkbox-group':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="grid grid-cols-2 gap-4">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`${field.name}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v: string) => v !== option.value);
                    updateFormData({ [field.name]: newValues });
                  }}
                />
                <Label htmlFor={`${field.name}-${option.value}`} className="text-sm cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
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
      {showCategorySelector && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              انتخاب دسته‌بندی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => updateFormData({ category: cat.slug })}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${(category || formData.category) === cat.slug
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50'
                    }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    {getCategoryIcon(cat.slug)}
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* فرم دینامیک */}
      {activeCategory && currentFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCategoryIcon(activeCategory)}
              اطلاعات {categories.find(c => c.slug === activeCategory)?.name}
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
      {showSubmitButton && activeCategory && currentFields.length > 0 && (
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
      {activeCategory && currentFields.length === 0 && (
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