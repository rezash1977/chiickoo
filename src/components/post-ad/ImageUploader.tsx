import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ImageUploaderProps {
  imageFiles: File[];
  setImageFiles: (files: File[]) => void;
  previewImages: string[];
  setPreviewImages: (images: string[]) => void;
  uploading: boolean;
  onUpload: (files: File[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageFiles,
  setImageFiles,
  previewImages,
  setPreviewImages,
  uploading,
  onUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + imageFiles.length > 3) {
      alert('حداکثر 3 تصویر مجاز است.');
      return;
    }
    
    const newFiles = [...imageFiles, ...files].slice(0, 3);
    setImageFiles(newFiles);
    setPreviewImages(newFiles.map(file => URL.createObjectURL(file)));
    onUpload(newFiles);
  };

  const handleRemoveImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setPreviewImages(newFiles.map(file => URL.createObjectURL(file)));
    onUpload(newFiles);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          تصاویر آگهی
          <Badge variant="secondary" className="text-xs">
            {imageFiles.length}/3
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[0, 1, 2].map(idx => (
            <div
              key={idx}
              className={`aspect-square rounded-lg border-2 border-dashed cursor-pointer transition-all hover:border-primary/50 ${
                previewImages[idx] ? 'border-gray-300' : 'border-gray-300'
              }`}
              onClick={handleImageClick}
            >
              {previewImages[idx] ? (
                <div className="relative w-full h-full">
                  <img
                    src={previewImages[idx]}
                    alt="preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    className="absolute top-2 left-2 bg-white rounded-full p-1 shadow hover:bg-red-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(idx);
                    }}
                  >
                    <span className="text-xs text-red-500">✕</span>
                  </button>
                  {idx === 0 && (
                    <Badge className="absolute bottom-2 right-2 text-xs">
                      اصلی
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-xs text-gray-400">
                    {idx === 0 ? 'عکس اصلی' : 'عکس اضافی'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={imageFiles.length >= 3}
        />

        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            حداکثر 3 تصویر مجاز است. تصویر اول به عنوان تصویر اصلی نمایش داده می‌شود.
          </p>
          
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              در حال آپلود تصاویر...
            </div>
          )}

          {imageFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {imageFiles.map((file, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {file.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUploader; 