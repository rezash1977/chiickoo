import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/components/ui/use-toast';
import Layout from '../components/layout/Layout';
import AdCard from '../components/ui/AdCard';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Ad {
  id: string;
  title: string;
  status: string;
  price?: number | null;
  location?: string | null;
  images?: string[];
  created_at: string;
}

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites, removeFromFavorites } = useFavorites();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setAds([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: favs, error: favsError } = await supabase
          .from('favorites')
          .select('ad_id')
          .eq('user_id', user.id);

        if (favsError || !favs || favs.length === 0) {
          setAds([]);
          setLoading(false);
          return;
        }

        const adIds = favs.map((f: any) => f.ad_id);

        const { data: adsData, error: adsError } = await supabase
          .from('ads')
          .select('id, title, status, price, location, images, created_at')
          .in('id', adIds)
          .order('created_at', { ascending: false });

        if (!adsError && adsData) {
          setAds(adsData);
        } else {
          setAds([]);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setAds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleRemoveFavorite = async (adId: string) => {
    const success = await removeFromFavorites(adId);
    if (success) {
      setAds(prev => prev.filter(ad => ad.id !== adId));
      toast({
        title: 'آگهی از نشان شده‌ها حذف شد',
        variant: 'default'
      });
    } else {
      toast({
        title: 'خطا در حذف از نشان شده‌ها',
        variant: 'destructive'
      });
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return 'توافقی';
    return `${Number(price).toLocaleString('fa-IR')} تومان`;
  };

  return (
    <Layout>
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb className="mb-4 text-white/80">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-white/80 hover:text-white">
                  <Link to="/">خانه</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/60" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">نشان شده‌ها</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold">آگهی‌های نشان شده</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              لیست آگهی‌های نشان شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8 gap-2">
                <Loader className="animate-spin w-8 h-8 text-violet-600" />
                <span>در حال بارگذاری...</span>
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>شما هیچ آگهی را نشان نکرده‌اید.</p>
                <Link to="/" className="text-primary mt-2 inline-block">مشاهده آگهی‌ها</Link>
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ads.map((ad) => (
                    <div key={ad.id} className="relative group">
                      <AdCard
                        id={ad.id}
                        title={ad.title}
                        price={ad.price ?? null}
                        location={ad.location ?? null}
                        imageUrl={ad.images && ad.images.length > 0 ? ad.images[0] : ''}
                        description={null}
                        categoryName="نشان شده"
                        userId={user?.id || ''}
                      />
                      <button
                        onClick={() => handleRemoveFavorite(ad.id)}
                        className="absolute top-2 left-10 p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors shadow-md z-10"
                        title="حذف از نشان شده‌ها"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FavoritesPage;
