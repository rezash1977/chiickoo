import React from 'react';
import SearchBar from '../search/SearchBar';
import { User, Plus, UserPlus, Settings, LogOut, Heart, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { useFavorites } from '@/hooks/useFavorites';
import { useCategories } from '@/hooks/useCategories';
import { NotificationCenter } from '../notifications/NotificationCenter';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const unreadCount = useUnreadMessagesCount(user?.id);
  const { favorites } = useFavorites();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  React.useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .single();
          if (data && !error) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminRole();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "خروج موفقیت‌آمیز",
        description: "شما با موفقیت از حساب خود خارج شدید",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "خطا در خروج",
        description: "خطایی در خروج از حساب رخ داد",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white py-4 mb-6 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4 md:gap-6">
          <Link to="/" className="text-2xl font-bold text-violet-600 mb-2 md:mb-0">چی کو</Link>
          <div className="relative mx-0 md:mx-2 w-full md:w-auto mb-2 md:mb-0">
            <button className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-full md:w-auto" type="button">
              دسته بندی ها
              <ChevronDown size={18} />
            </button>
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden group-hover:block hover:block">
              {categoriesLoading ? (
                <div className="p-4 text-center text-gray-400">در حال بارگذاری...</div>
              ) : categories && categories.length > 0 ? (
                <ul className="py-2">
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <Link to={`/category/${cat.slug}`} className="block px-4 py-2 hover:bg-gray-100 text-gray-700">
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-400">دسته‌بندی‌ای یافت نشد</div>
              )}
            </div>
          </div>
          <div className="w-full md:flex-1 md:mx-6">
            <SearchBar className="w-full" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            {!user ? (
              <>
                <Link to="/login" className="flex flex-col items-center text-gray-600 hover:text-violet-600">
                  <User size={24} className="text-fuchsia-600" />
                  <span className="text-xs mt-1">ورود</span>
                </Link>
                <Link to="/register" className="flex flex-col items-center text-gray-600 hover:text-violet-600">
                  <UserPlus size={24} className="text-violet-600" />
                  <span className="text-xs mt-1">ثبت‌نام</span>
                </Link>
              </>
            ) : (
              <>
                <NotificationCenter />
                <Link to="/account" className="flex flex-col items-center relative text-gray-600 hover:text-violet-600">
                  <User size={24} className="text-fuchsia-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                  <span className="text-xs mt-1">حساب من</span>
                </Link>
                <Link to="/favorites" className="flex flex-col items-center relative text-gray-600 hover:text-violet-600">
                  <Heart size={24} className="text-red-500" />
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {favorites.length > 99 ? '99+' : favorites.length}
                    </span>
                  )}
                  <span className="text-xs mt-1">نشان شده</span>
                </Link>
                <button onClick={handleSignOut} className="flex flex-col items-center text-gray-600 hover:text-violet-600">
                  <LogOut size={24} className="text-violet-600" />
                  <span className="text-xs mt-1">خروج</span>
                </button>
              </>
            )}
            <Link to="/post-ad" className="flex items-center">
              <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg px-4 py-2 text-white shadow-lg">
                <Plus size={24} />
                <span className="text-base font-medium">ثبت آگهی</span>
              </button>
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex flex-col items-center text-gray-600 hover:text-violet-600">
                <Settings size={24} className="text-primary" />
                <span className="text-xs mt-1">مدیریت</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
