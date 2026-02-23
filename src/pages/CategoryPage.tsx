import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, Heart } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useAds } from '@/hooks/useAds';
import Layout from '../components/layout/Layout';
import Navbar from '../components/layout/Navbar';
import AdCard from '../components/ui/AdCard';
import { formatPrice } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";



const CategoryPage: React.FC = () => {
  const { categoryId } = useParams();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: ads, isLoading: adsLoading, error: adsError } = useAds(categoryId);

  const [sortOpen, setSortOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('جدیدترین');

  // Find the current category
  const currentCategory = categories?.find(cat => cat.slug === categoryId);

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 pb-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 pb-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500">دسته‌بندی یافت نشد</p>
            <Link to="/" className="text-primary mt-2 inline-block">بازگشت به صفحه اصلی</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 pb-16">
        <Breadcrumb className="mb-4 mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">خانه</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentCategory.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="bg-white rounded-lg shadow-sm p-4">
          {adsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex border-b border-gray-100 py-3">
                  <div className="w-24 h-24 rounded-md bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 pr-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : adsError ? (
            <div className="text-center py-10">
              <p className="text-red-500">خطا در بارگذاری آگهی‌ها</p>
            </div>
          ) : ads && ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ads.map((ad) => (
                <AdCard
                  key={ad.id}
                  id={ad.id}
                  title={ad.title}
                  price={ad.price}
                  location={ad.location}
                  imageUrl={ad.images?.[0] || ''}
                  description={ad.description}
                  categoryName={currentCategory.name}
                  userId={ad.user_id}
                  createdAt={ad.created_at}
                  showPhone={(ad as any).ad_details?.[0]?.features?.show_phone !== false && (ad as any).ad_details?.[0]?.features?.show_phone !== 'false'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">آگهی‌ای در این دسته‌بندی یافت نشد</p>
              <Link to="/post-ad" className="text-primary mt-2 inline-block">اولین آگهی را ثبت کنید</Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CategoryPage;
