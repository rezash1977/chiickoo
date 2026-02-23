import React from 'react';
import { Link } from 'react-router-dom';
import { House, Car, Settings, Smartphone, Sofa, Briefcase } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

interface CategoryProps {
  icon: React.ReactNode;
  name: string;
  color: string;
  link: string;
}

const Category: React.FC<CategoryProps> = ({ icon, name, color, link }) => {
  return (
    <Link to={link} className="flex flex-col items-center">
      <div className="category-card-horizontal shadow-sm hover:shadow-md w-12 h-12 md:w-20 md:h-20" style={{ backgroundColor: color }}>
        <div className="text-white">
          {icon}
        </div>
        <span className="mt-0.5 text-[9px] md:text-xs font-bold text-white text-center leading-[1.1]">{name}</span>
      </div>
    </Link>
  );
};

const getIconForCategory = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    home: <House className="w-4 h-4 md:w-5 md:h-5" />,
    car: <Car className="w-4 h-4 md:w-5 md:h-5" />,
    wrench: <Settings className="w-4 h-4 md:w-5 md:h-5" />,
    smartphone: <Smartphone className="w-4 h-4 md:w-5 md:h-5" />,
    sofa: <Sofa className="w-4 h-4 md:w-5 md:h-5" />,
    briefcase: <Briefcase className="w-4 h-4 md:w-5 md:h-5" />,
  };
  
  return iconMap[iconName] || <House className="w-4 h-4 md:w-5 md:h-5" />;
};

const CategoryList: React.FC = () => {
  const { data: categories, isLoading, error } = useCategories();

  // Define vibrant colors for categories
  const getVibrantColor = (slug: string) => {
    const vibrantColors: { [key: string]: string } = {
      'realestate': '#8B5CF6',
      'cars': '#10B981', 
      'services': '#F97316',
      'electronics': '#3B82F6',
      'furniture': '#EC4899',
      'jobs': '#EAB308'
    };
    return vibrantColors[slug] || '#8B5CF6';
  };

  if (isLoading) {
    return (
      <div className="py-2 md:py-3 mb-4">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide space-x-3 pb-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-14 h-14 md:w-20 md:h-20 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading categories:', error);
    return (
      <div className="py-2 md:py-3 mb-4">
        <div className="container mx-auto px-4">
          <div className="text-center py-2">
            <p className="text-red-500 text-xs">خطا در بارگذاری دسته‌بندی‌ها</p>
          </div>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="py-2 md:py-3 mb-4">
        <div className="container mx-auto px-4">
          <div className="text-center py-2">
            <p className="text-gray-500 text-xs">هیچ دسته‌بندی‌ای یافت نشد</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 mb-2">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pb-2">
          {categories.map((category) => (
            <Category
              key={category.id}
              icon={getIconForCategory(category.icon)}
              name={category.name}
              color={getVibrantColor(category.slug)}
              link={`/category/${category.slug}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryList;
