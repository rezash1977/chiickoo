import React, { useState, useEffect } from 'react';
import { User, Plus, Settings, LogOut, Heart, MessageSquare, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { useFavorites } from '@/hooks/useFavorites';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const unreadCount = useUnreadMessagesCount(user?.id);
  const { favorites } = useFavorites();

  useEffect(() => {
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 z-20 md:hidden"
      style={{ boxShadow: '0 -2px 12px rgba(0,0,0,0.08)' }}>
      <div className="flex justify-around items-center px-2 relative">

        {/* خانه */}
        <Link to="/" className="flex flex-col items-center text-teal-500 hover:text-teal-600 flex-1">
          <Home size={22} />
          <span className="text-[10px] mt-0.5 font-medium">خانه</span>
        </Link>

        {/* ثبت آگهی - مرکز و برجسته */}
        <Link to="/post-ad" className="absolute left-1/2 transform -translate-x-1/2 -top-4">
          <div className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 rounded-full p-3 text-white shadow-lg">
            <Plus size={24} />
          </div>
          <span className="text-[10px] mt-0.5 text-teal-500 font-semibold block text-center">ثبت آگهی</span>
        </Link>

        {/* حساب کاربر */}
        {!user ? (
          <Link to="/login" className="flex flex-col items-center text-teal-500 hover:text-teal-600 flex-1">
            <User size={22} />
            <span className="text-[10px] mt-0.5 font-medium">ورود</span>
          </Link>
        ) : (
          <>
            {/* حساب من */}
            <Link to="/account" className="flex flex-col items-center relative text-teal-500 hover:text-teal-600 flex-1">
              <User size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-2 bg-red-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="text-[10px] mt-0.5 font-medium">حساب من</span>
            </Link>

            {/* نشان‌ها */}
            <Link to="/favorites" className="flex flex-col items-center relative text-red-500 hover:text-red-600 flex-1">
              <Heart size={22} />
              {favorites.length > 0 && (
                <span className="absolute top-0 right-2 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                  {favorites.length > 9 ? '9+' : favorites.length}
                </span>
              )}
              <span className="text-[10px] mt-0.5 font-medium">نشان‌ها</span>
            </Link>

            {/* چت */}
            <Link to="/chat" className="flex flex-col items-center text-teal-500 hover:text-teal-600 flex-1">
              <MessageSquare size={22} />
              <span className="text-[10px] mt-0.5 font-medium">چت</span>
            </Link>

            {/* خروج */}
            <button
              onClick={handleSignOut}
              className="flex flex-col items-center text-teal-500 hover:text-teal-600 flex-1"
            >
              <LogOut size={22} />
              <span className="text-[10px] mt-0.5 font-medium">خروج</span>
            </button>

            {/* مدیریت - فقط ادمین */}
            {isAdmin && (
              <Link to="/admin" className="flex flex-col items-center text-teal-500 hover:text-teal-600 flex-1">
                <Settings size={22} />
                <span className="text-[10px] mt-0.5 font-medium">مدیریت</span>
              </Link>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;