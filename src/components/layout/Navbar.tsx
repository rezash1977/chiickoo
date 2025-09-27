
import React, { useState, useEffect } from 'react';
import { User, Plus, UserPlus, Settings, LogOut, Heart, MessageSquare } from 'lucide-react';
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

  // Check if user is admin
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
          
          if (error) {
            console.log('Error checking admin role:', error);
            setIsAdmin(false);
          } else if (data) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.log('User is not admin or error checking role:', error);
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
      console.error('Sign out error:', error);
      toast({
        title: "خطا در خروج",
        description: "خطایی در خروج از حساب رخ داد",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white bg-red-400 border-t border-gray-200 py-2 z-20 shadow-lg md:hidden">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center">
          {/* ورود و ثبت‌نام */}
          {!user && (
            <Link to="/login" className="flex flex-col items-center text-gray-600 hover:text-violet-600">
              <User size={20} className="text-fuchsia-600" />
              <span className="text-xs mt-1">ورود</span>
            </Link>
          )}
          {!user && (
            <Link to="/register" className="flex flex-col items-center text-gray-600 hover:text-violet-600">
              <UserPlus size={20} className="text-violet-600" />
              <span className="text-xs mt-1">ثبت‌نام</span>
            </Link>
          )}
          {/* حساب من، نشان شده، خروج */}
          {user && (
            <Link to="/account" className="flex flex-col items-center relative text-gray-600 hover:text-violet-600">
              <User size={20} className="text-fuchsia-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
              <span className="text-xs mt-1">حساب من</span>
            </Link>
          )}
          {user && (
            <Link to="/favorites" className="flex flex-col items-center relative text-gray-600 hover:text-violet-600">
              <Heart size={20} className="text-red-500" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {favorites.length > 99 ? '99+' : favorites.length}
                </span>
              )}
              <span className="text-xs mt-1">نشان شده</span>
            </Link>
          )}
          {user && (
            <Link to="/chat" className="flex flex-col items-center relative text-gray-600 hover:text-violet-600">
              <MessageSquare size={20} className="text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
              <span className="text-xs mt-1">چت</span>
            </Link>
          )}
          {user && (
            <button 
              onClick={handleSignOut}
              className="flex flex-col items-center text-gray-600 hover:text-violet-600"
            >
              <LogOut size={20} className="text-violet-600" />
              <span className="text-xs mt-1">خروج</span>
            </button>
          )}
          {/* ثبت آگهی */}
          <Link to="/post-ad" className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full p-2 text-white shadow-lg">
              <Plus size={20} />
            </div>
            <span className="text-xs mt-1 text-violet-600 font-medium">ثبت آگهی</span>
          </Link>
          {/* خانه */}
          <Link to="/" className="flex flex-col items-center text-gray-600 hover:text-violet-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 22V12h6v10M3 9l9-7 9 7v13H3V9z" />
            </svg>
            <span className="text-xs mt-1">خانه</span>
          </Link>
          {/* مدیریت */}
          {isAdmin && (
            <Link to="/admin" className="flex flex-col items-center text-gray-600 hover:text-violet-600">
              <Settings size={20} className="text-primary" />
              <span className="text-xs mt-1">مدیریت</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
