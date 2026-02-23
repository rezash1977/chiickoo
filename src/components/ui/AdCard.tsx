import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, MapPin } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice, formatDateRelative } from '@/lib/utils';
import ContactInfoModal from './ContactInfoModal';

interface AdCardProps {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  imageUrl: string;
  description: string | null;
  categoryName: string;
  userId: string;
  createdAt?: string;
  showFavoriteButton?: boolean;
  showPhone?: boolean;
  className?: string;
}

const AdCard: React.FC<AdCardProps> = ({ 
  id, 
  title, 
  price, 
  location, 
  imageUrl, 
  description, 
  categoryName,
  userId,
  createdAt,
  showFavoriteButton = true,
  showPhone = true,
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showContactModal, setShowContactModal] = useState(false);

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

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContactModal(true);
  };

  return (
    <>
      <div className={`relative bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow animate-fade-in h-[100px] md:h-[135px] ${className}`}>
        <Link to={`/ad/${id}`} className="flex items-stretch h-full">
          <div className="w-24 md:w-32 flex-shrink-0">
            <img 
              src={imageUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43'} 
              alt={title} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 p-2 md:p-3 min-w-0 flex flex-col justify-between">
            <div className="min-w-0">
              <h3 className="font-bold text-xs md:text-sm mb-0.5 truncate">{title}</h3>
              {price !== null && (
                <p className="text-primary font-bold text-xs md:text-sm mb-1">{formatPrice(price)} تومان</p>
              )}
              <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-500 mb-1">
                <span className="bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[60px] md:max-w-[100px]">{categoryName}</span>
                <div className="flex items-center gap-1 min-w-0">
                  {createdAt && <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDateRelative(createdAt)}</span>}
                  {location && <span className="flex items-center gap-0.5 truncate text-gray-400"><MapPin className="w-2.5 h-2.5" /> <span className="truncate">{location}</span></span>}
                </div>
              </div>
            </div>
            {description && (
              <p className="text-[10px] md:text-xs text-gray-400 line-clamp-1 md:line-clamp-2 leading-tight hidden sm:block overflow-hidden">
                {description}
              </p>
            )}
          </div>
        </Link>

        {showFavoriteButton && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 left-2 p-1.5 rounded-full transition-all bg-white shadow-md"
            title="نشان کردن آگهی"
          >
            <Heart className="w-3 h-3" />
          </button>
        )}

        {showPhone && (
          <button
            onClick={handleContactClick}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-md"
            title="اطلاعات تماس"
          >
            <Mail className="w-3 h-3" />
          </button>
        )}
      </div>

      <ContactInfoModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        userId={userId}
        adTitle={title}
        adId={id}
      />
    </>
  );
};

export default AdCard;
