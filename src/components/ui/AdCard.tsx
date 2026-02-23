import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, MapPin } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';
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
      <div className={`relative bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow animate-fade-in ${className}`}>
        <Link to={`/ad/${id}`} className="flex items-center">
          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
            <img 
              src={imageUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43'} 
              alt={title} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 p-3 md:p-4 min-w-0">
            <h3 className="font-bold text-sm md:text-base mb-1 truncate">{title}</h3>
            {price !== null && (
              <p className="text-primary font-bold text-sm md:text-base mb-1">{formatPrice(price)} تومان</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="bg-gray-100 px-2 py-0.5 rounded">{categoryName}</span>
              {location && <span className="flex items-center gap-1 group-hover:text-primary transition-colors"><MapPin className="w-3 h-3" /> {location}</span>}
            </div>
            {description && (
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed hidden sm:block">
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
