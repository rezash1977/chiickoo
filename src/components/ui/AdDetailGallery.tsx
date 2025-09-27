import React, { useState } from 'react';
import { Dialog, DialogContent } from './dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './carousel';

interface AdDetailGalleryProps {
  images: string[];
  title?: string;
}

const AdDetailGallery: React.FC<AdDetailGalleryProps> = ({ images, title }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (!images || images.length === 0) return null;

  return (
    <div>
      {/* Main Image */}
      <div className="w-full aspect-w-16 aspect-h-10 rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in mb-2" onClick={() => setZoomOpen(true)}>
        <img
          src={images[activeIndex]}
          alt={title || ''}
          className="w-full h-full object-cover transition-all duration-200 hover:scale-105"
        />
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img + idx}
              onClick={() => setActiveIndex(idx)}
              className={`rounded-lg border-2 ${activeIndex === idx ? 'border-violet-600' : 'border-transparent'} focus:outline-none focus:ring-2 focus:ring-violet-400`}
              style={{ minWidth: 64, minHeight: 48 }}
            >
              <img
                src={img}
                alt={title || ''}
                className="w-16 h-12 object-cover rounded-lg"
              />
            </button>
          ))}
        </div>
      )}
      {/* Zoom Modal */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-2xl p-0 bg-black flex flex-col items-center justify-center">
          <Carousel opts={{ startIndex: activeIndex }}>
            <CarouselContent>
              {images.map((img, idx) => (
                <CarouselItem key={img + idx} className="flex items-center justify-center">
                  <img
                    src={img}
                    alt={title || ''}
                    className="max-h-[80vh] w-auto object-contain rounded-lg bg-black"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="bg-white/80 hover:bg-white absolute left-2 top-1/2 -translate-y-1/2 z-10" />
            <CarouselNext className="bg-white/80 hover:bg-white absolute right-2 top-1/2 -translate-y-1/2 z-10" />
          </Carousel>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdDetailGallery; 