import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader, RefreshCw, Archive, Eye } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import { useUserAds, renewAd, shouldArchiveAd } from '@/hooks/useAds';
import { useToast } from '@/hooks/use-toast';
import { ArchiveWarning } from '@/components/ui/archive-warning';

interface Ad {
  id: string;
  title: string;
  status: string;
  price?: number | null;
  views?: number;
  created_at: string;
  categories?: { name: string; slug: string };
}

const MyAdsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [renewingAds, setRenewingAds] = useState<Set<string>>(new Set());

  const { data: ads, isLoading, refetch } = useUserAds(user?.id || '');

  const handleRenewAd = async (adId: string) => {
    if (!user) return;
    
    setRenewingAds(prev => new Set(prev).add(adId));
    
    try {
      await renewAd(adId);
      toast({
        title: "آگهی تمدید شد",
        description: "آگهی شما با موفقیت تمدید شد و دوباره فعال است.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "خطا در تمدید آگهی",
        description: "متأسفانه در تمدید آگهی مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setRenewingAds(prev => {
        const newSet = new Set(prev);
        newSet.delete(adId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string, createdAt: string) => {
    const isArchivable = status === 'active' && shouldArchiveAd(createdAt);
    
    switch (status) {
      case 'active':
        return (
          <Badge variant={isArchivable ? "secondary" : "default"}>
            {isArchivable ? "نیاز به تمدید" : "فعال"}
          </Badge>
        );
      case 'archived':
        return <Badge variant="secondary">آرشیو شده</Badge>;
      case 'pending':
        return <Badge variant="outline">در انتظار تایید</Badge>;
      case 'rejected':
        return <Badge variant="destructive">رد شده</Badge>;
      case 'expired':
        return <Badge variant="destructive">منقضی شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAds = ads?.filter(ad => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'archived') return ad.status === 'archived';
    if (statusFilter === 'active') return ad.status === 'active';
    if (statusFilter === 'needs-renewal') return ad.status === 'active' && shouldArchiveAd(ad.created_at);
    return ad.status === statusFilter;
  }) || [];

  return (
    <Layout>
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">آگهی‌های من</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        {/* Archive Warning Component */}
        {ads && ads.length > 0 && (
          <ArchiveWarning
            ads={ads}
            onRenewAd={handleRenewAd}
            renewingAds={renewingAds}
          />
        )}
        
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>لیست آگهی‌های شما</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="فیلتر بر اساس وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه آگهی‌ها</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="needs-renewal">نیاز به تمدید</SelectItem>
                    <SelectItem value="archived">آرشیو شده</SelectItem>
                    <SelectItem value="pending">در انتظار تایید</SelectItem>
                    <SelectItem value="rejected">رد شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader className="animate-spin w-8 h-8 text-violet-600" />
                <span className="mr-2">در حال بارگذاری...</span>
              </div>
            ) : filteredAds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {statusFilter === 'all' 
                  ? "شما هیچ آگهی ثبت نکرده‌اید."
                  : `هیچ آگهی‌ای با وضعیت انتخاب شده یافت نشد.`
                }
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عنوان</TableHead>
                    <TableHead>دسته‌بندی</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>قیمت</TableHead>
                    <TableHead>تعداد بازدید</TableHead>
                    <TableHead>تاریخ ثبت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell>{ad.categories?.name || '-'}</TableCell>
                      <TableCell>
                        {getStatusBadge(ad.status, ad.created_at)}
                      </TableCell>
                      <TableCell>
                        {ad.price !== null && ad.price !== undefined && String(ad.price).trim() !== '' && !isNaN(Number(ad.price))
                          ? Number(ad.price).toLocaleString('fa-IR') + ' تومان'
                          : '—'}
                      </TableCell>
                      <TableCell>{ad.views ?? 0}</TableCell>
                      <TableCell>{new Date(ad.created_at).toLocaleDateString('fa-IR')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/ad/${ad.id}`} 
                            className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700"
                          >
                            <Eye className="w-4 h-4" />
                            مشاهده
                          </Link>
                          {(ad.status === 'archived' || (ad.status === 'active' && shouldArchiveAd(ad.created_at))) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRenewAd(ad.id)}
                              disabled={renewingAds.has(ad.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              {renewingAds.has(ad.id) ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              تمدید
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MyAdsPage; 