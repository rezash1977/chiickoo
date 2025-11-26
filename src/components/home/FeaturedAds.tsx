import React, { useState } from 'react';
import { useAds, SortOption } from '@/hooks/useAds';
import AdCard from '@/components/ui/AdCard';

const FeaturedAds: React.FC = () => {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const { data: ads, isLoading, error } = useAds(undefined, sortBy);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 mb-20">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex bg-gray-200 rounded-lg h-24 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading ads:', error);
    return (
      <div className="container mx-auto px-4 mb-20">
        <p className="text-red-500">خطا در بارگذاری آگهی‌ها</p>
      </div>
    );
  }

  const featuredAds = ads || [];

  return (
    <div className="container mx-auto px-4 mb-20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">آگهی‌های ویژه</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="newest">جدیدترین</option>
          <option value="oldest">قدیمی‌ترین</option>
          <option value="price_asc">ارزان‌ترین</option>
          <option value="price_desc">گران‌ترین</option>
        </select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {featuredAds.length > 0 ? (
          featuredAds.map((ad) => (
            <AdCard
              key={ad.id}
              id={ad.id}
              title={ad.title}
              price={ad.price}
              location={ad.location}
              imageUrl={ad.images?.[0] || ''}
              description={ad.description}
              categoryName={ad.categories?.name || 'دسته‌بندی نامشخص'}
            />
          ))
        ) : (
          <div className="text-center py-8 col-span-4">
            <p className="text-gray-500">هنوز آگهی‌ای ثبت نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedAds;
