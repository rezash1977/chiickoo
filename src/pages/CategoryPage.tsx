import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, Heart } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useAds } from '@/hooks/useAds';
import Layout from '../components/layout/Layout';
import Navbar from '../components/layout/Navbar';
import { formatPrice } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface AdProps {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  images: string[];
  created_at: string;
  description: string | null;
}

const AdItem: React.FC<AdProps> = ({ id, title, price, location, images, created_at, description }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'امروز';
    if (diffDays === 2) return 'دیروز';
    return `${diffDays} روز پیش`;
  };

  const imageUrl = images && images.length > 0 
    ? images[0] 
    : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop';

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: 'برای نشان کردن آگهی ابتدا وارد شوید',
        variant: 'destructive'
      });
      return;
    }

    const success = await toggleFavorite(id);
    if (success) {
      toast({
        title: isFavorite(id) 
          ? 'آگهی از نشان شده‌ها حذف شد' 
          : 'آگهی به نشان شده‌ها اضافه شد',
        variant: 'default'
      });
    } else {
      toast({
        title: 'خطا در تغییر وضعیت نشان کردن',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="relative flex border-b border-gray-100 py-2 animate-fade-in items-center">
      <Link to={`/ad/${id}`} className="flex items-center flex-1">
        <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 pr-2 min-w-0">
          <h3 className="font-medium text-xs mb-0.5 truncate">{title}</h3>
          {price && (
            <p className="text-green-600 font-bold text-xs mb-0.5">{formatPrice(price)} تومان</p>
          )}
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 text-[10px]">{location || 'موقعیت نامشخص'}</span>
            <span className="text-gray-400 text-[10px]">{formatDate(created_at)}</span>
          </div>
          {description && (
            <p className="text-[10px] text-gray-600 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </Link>
      
      <button
        onClick={handleFavoriteClick}
        className={`mr-2 p-1.5 rounded-full transition-all ${
          isFavorite(id)
            ? 'bg-red-500 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white'
        }`}
      >
        <Heart className={`w-3 h-3 ${isFavorite(id) ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
};

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ads.map((ad) => (
                <AdItem
                  key={ad.id}
                  id={ad.id}
                  title={ad.title}
                  price={ad.price}
                  location={ad.location}
                  images={ad.images || []}
                  created_at={ad.created_at}
                  description={ad.description}
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
