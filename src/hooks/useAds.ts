
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Ad {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  price: number | null;
  location: string | null;
  phone: string | null;
  status: 'pending' | 'active' | 'expired' | 'rejected' | 'archived';
  images: string[];
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

// Function to check if an ad should be archived (older than 1 month)
export const shouldArchiveAd = (createdAt: string): boolean => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return new Date(createdAt) < oneMonthAgo;
};

// Function to check if an ad needs archive warning (approaching 1 month)
export const needsArchiveWarning = (createdAt: string): boolean => {
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() - 25); // 5 days before archive
  return new Date(createdAt) < warningDate;
};

// Function to get days until archive
export const getDaysUntilArchive = (createdAt: string): number => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const daysDiff = Math.ceil((oneMonthAgo.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysDiff);
};

// Function to archive an ad
export const archiveAd = async (adId: string): Promise<void> => {
  const { error } = await supabase
    .from('ads')
    .update({ status: 'archived' })
    .eq('id', adId);
  
  if (error) {
    console.error('Error archiving ad:', error);
    throw error;
  }
};

// Function to renew an ad (reset to active status)
export const renewAd = async (adId: string): Promise<void> => {
  const { error } = await supabase
    .from('ads')
    .update({ 
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', adId);
  
  if (error) {
    console.error('Error renewing ad:', error);
    throw error;
  }
};

// Function to get ads that need archiving (for admin use)
export const getAdsNeedingArchive = async (): Promise<Ad[]> => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'active')
    .lt('created_at', oneMonthAgo.toISOString());
  
  if (error) {
    console.error('Error fetching ads needing archive:', error);
    throw error;
  }
  
  return data || [];
};

// Function to get ads that need archive warnings
export const getAdsNeedingWarning = async (): Promise<Ad[]> => {
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() - 25); // 5 days before archive
  
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'active')
    .lt('created_at', warningDate.toISOString());
  
  if (error) {
    console.error('Error fetching ads needing warning:', error);
    throw error;
  }
  
  return data || [];
};

// Function to get archived ads count
export const getArchivedAdsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('ads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'archived');
  
  if (error) {
    console.error('Error fetching archived ads count:', error);
    throw error;
  }
  
  return count || 0;
};

// Function to get active ads count
export const getActiveAdsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('ads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  if (error) {
    console.error('Error fetching active ads count:', error);
    throw error;
  }
  
  return count || 0;
};

export const useAds = (categorySlug?: string) => {
  return useQuery({
    queryKey: ['ads', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('ads')
        .select(`
          *,
          categories!inner(slug, name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (categorySlug) {
        query = query.eq('categories.slug', categorySlug);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching ads:', error);
        throw error;
      }
      
      return data as (Ad & { categories: { slug: string; name: string } })[];
    },
  });
};

export const useAdById = (adId: string) => {
  return useQuery({
    queryKey: ['ad', adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          categories(name, slug)
        `)
        .eq('id', adId)
        .single();
      
      if (error) {
        console.error('Error fetching ad:', error);
        throw error;
      }
      
      return data;
    },
  });
};

// Hook to get user's ads including archived ones
export const useUserAds = (userId: string) => {
  return useQuery({
    queryKey: ['user-ads', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          categories(name, slug)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user ads:', error);
        throw error;
      }
      
      return data as (Ad & { categories: { name: string; slug: string } })[];
    },
    enabled: !!userId,
  });
};

// Hook to get ads needing archive warnings for a specific user
export const useUserAdsNeedingWarning = (userId: string) => {
  return useQuery({
    queryKey: ['user-ads-warning', userId],
    queryFn: async () => {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() - 25);
      
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          categories(name, slug)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .lt('created_at', warningDate.toISOString());
      
      if (error) {
        console.error('Error fetching user ads needing warning:', error);
        throw error;
      }
      
      return data as (Ad & { categories: { name: string; slug: string } })[];
    },
    enabled: !!userId,
  });
};
