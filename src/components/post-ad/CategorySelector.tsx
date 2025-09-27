import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange, className = '' }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, color, icon')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
          setError('خطا در بارگذاری دسته‌بندی‌ها');
          return;
        }

        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('خطا در بارگذاری دسته‌بندی‌ها');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className={`w-full border rounded p-2 text-sm bg-gray-100 ${className}`}>
        <span className="text-gray-500">در حال بارگذاری دسته‌بندی‌ها...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full border rounded p-2 text-sm bg-red-50 border-red-200 ${className}`}>
        <span className="text-red-500">{error}</span>
      </div>
    );
  }

  return (
    <select 
      className={`w-full border rounded p-2 text-sm ${className}`}
      value={value} 
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">انتخاب دسته‌بندی</option>
      {categories.map((category) => (
        <option key={category.id} value={category.slug}>
          {category.name}
        </option>
      ))}
    </select>
  );
};

export default CategorySelector; 