import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Building2, Store, MapPin, DollarSign, Phone, FileText } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SimpleAdFormProps {
  formData: any;
  updateFormData: (data: any) => void;
  submitting: boolean;
  uploading: boolean;
  touched: { title?: boolean; description?: boolean };
  setTouched: (t: { title?: boolean; description?: boolean }) => void;
  titleRef: React.RefObject<HTMLInputElement>;
  descRef: React.RefObject<HTMLTextAreaElement>;
  error?: string | null;
}

const SimpleAdForm: React.FC<SimpleAdFormProps> = ({
  formData,
  updateFormData,
  submitting,
  uploading,
  touched,
  setTouched,
  titleRef,
  descRef,
  error
}) => {
  const handleClear = () => {
    updateFormData({ title: '', description: '' });
    setTouched({});
  };

  return (
    <div className="space-y-8">
      {/* عنوان آگهی */}
      <div className="space-y-2">
        <label className="text-lg font-bold flex items-center gap-2">
          عنوان آگهی <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          ref={titleRef}
          className={`w-full border rounded p-3 text-base ${touched.title && !formData.title ? 'border-red-500' : ''}`}
          placeholder="عنوان آگهی خود را بنویسید"
          value={formData.title || ''}
          onChange={e => updateFormData({ ...formData, title: e.target.value })}
          onBlur={() => setTouched({ ...touched, title: true })}
        />
        <p className="text-xs text-gray-500 mt-1">ویرایش عنوان فقط تا ۳ روز پس از انتشار آگهی ممکن است.</p>
      </div>

      {/* توضیحات آگهی */}
      <div className="space-y-2">
        <label className="text-lg font-bold flex items-center gap-2">
          توضیحات آگهی <span className="text-red-500">*</span>
        </label>
        <textarea
          ref={descRef}
          className={`w-full border rounded p-3 text-base ${touched.description && !formData.description ? 'border-red-500' : ''}`}
          placeholder="توضیحات مربوط به آگهی را بنویسید"
          value={formData.description || ''}
          onChange={e => updateFormData({ ...formData, description: e.target.value })}
          onBlur={() => setTouched({ ...touched, description: true })}
          rows={5}
        />
      </div>

      <div className="flex flex-row gap-4 mt-8">
        <Button
          type="button"
          variant="outline"
          className="flex-1 py-3 text-lg border-gray-300"
          onClick={handleClear}
          disabled={submitting || uploading}
        >
          پاک کردن اطلاعات
        </Button>
      </div>
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      )}
    </div>
  );
};

export default SimpleAdForm; 