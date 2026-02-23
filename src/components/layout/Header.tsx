import React, { useState } from 'react';
import SearchBar from '../search/SearchBar';
import { User, Plus, Settings, LogOut, Heart, Menu, X, ChevronDown } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
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
          setIsAdmin(!!(data && !error));
        } catch {
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
    } catch {
      toast({
        title: "خطا در خروج",
        description: "خطایی در خروج از حساب رخ داد",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md" dir="rtl">
      {/* ردیف اصلی هدر */}
      <div className="container mx-auto px-3 md:px-4 py-2 md:py-3">
        <div className="flex items-center gap-2 md:gap-4">

          {/* لوگو */}
          <Link 
            to="/" 
            className="text-xl md:text-2xl font-bold 
                       text-teal-500 
                       whitespace-nowrap flex items-center gap-1"
          >
            چی کو
            <img 
              src="/favicon.ico" 
              alt="logo"
              className="w-4 h-4 md:w-5 md:h-5 opacity-80"
            />
          </Link>

          {/* سرچ - همیشه نمایش داده می‌شود */}
          <div className="flex-1 min-w-0">
            <SearchBar className="w-full" />
          </div>

          {/* دسته‌بندی - فقط دسکتاپ */}
          <div className="hidden md:block relative flex-shrink-0">
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm text-teal-500"
              type="button"
            >
              دسته‌بندی‌ها
              <ChevronDown size={16} className={`transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
            </button>
            {categoryOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                {categoriesLoading ? (
                  <div className="p-4 text-center text-gray-400 text-sm">در حال بارگذاری...</div>
                ) : categories && categories.length > 0 ? (
                  <ul className="py-1 max-h-64 overflow-y-auto">
                    {categories.map(cat => (
                      <li key={cat.id}>
                        <Link
                          to={`/category/${cat.slug}`}
                          className="block px-4 py-2 hover:bg-gray-50 text-teal-500 text-sm"
                          onClick={() => setCategoryOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">دسته‌بندی‌ای یافت نشد</div>
                )}
              </div>
            )}
          </div>

          {/* آیکون‌های دسکتاپ */}
          <div className="hidden md:flex items-center gap-5 flex-shrink-0">
            {!user ? (
              <Link to="/login" className="flex flex-col items-center text-teal-500 hover:text-teal-600">
                <User size={22} />
                <span className="text-xs mt-0.5">ورود</span>
              </Link>
            ) : (
              <>
                <NotificationCenter />
                <Link to="/account" className="flex flex-col items-center relative text-teal-500 hover:text-teal-600">
                  <User size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  <span className="text-xs mt-0.5">حساب من</span>
                </Link>
                <Link to="/favorites" className="flex flex-col items-center relative text-red-500 hover:text-red-600">
                  <Heart size={22} />
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                      {favorites.length > 9 ? '9+' : favorites.length}
                    </span>
                  )}
                  <span className="text-xs mt-0.5">نشان‌ها</span>
                </Link>
                <button onClick={handleSignOut} className="flex flex-col items-center text-teal-500 hover:text-teal-600">
                  <LogOut size={22} />
                  <span className="text-xs mt-0.5">خروج</span>
                </button>
                {isAdmin && (
                  <Link to="/admin" className="flex flex-col items-center text-teal-500 hover:text-teal-600">
                    <Settings size={22} />
                    <span className="text-xs mt-0.5">مدیریت</span>
                  </Link>
                )}
              </>
            )}
            <Link to="/post-ad">
              <button className="flex items-center gap-1.5 
                                 bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 
                                 rounded-lg px-3 py-2 text-white shadow-md text-sm font-medium whitespace-nowrap
                                 hover:from-teal-500 hover:to-cyan-500 transition-colors">
                <Plus size={18} />
                ثبت آگهی
              </button>
            </Link>
          </div>

          {/* همبرگر منو - فقط موبایل */}
          <button
            className="md:hidden flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-teal-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="منو"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* منوی موبایل - کشویی */}
      {mobileMenuOpen && (
        <div
          className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-2 shadow-lg"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* دسته‌بندی‌ها */}
          <div className="border-b border-gray-100 pb-2 mb-2">
            <p className="text-xs font-semibold text-gray-400 mb-1.5 px-1">دسته‌بندی‌ها</p>
            {categoriesLoading ? (
              <p className="text-sm text-gray-400 px-1">در حال بارگذاری...</p>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {categories?.slice(0, 9).map(cat => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="text-sm text-teal-500 bg-gray-50 rounded-md px-2 py-1.5 text-center truncate hover:bg-teal-50 hover:text-teal-600"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/post-ad"
            className="flex items-center gap-2 bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 rounded-lg px-4 py-2.5 text-white font-medium w-full justify-center hover:from-teal-500 hover:to-cyan-500 transition-colors"
          >
            <Plus size={18} />
            ثبت آگهی جدید
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;