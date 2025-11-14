import React, { useState, useEffect, useCallback } from 'react';
import { CloseIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface ImageViewerProps {
  images: string[];
  startIndex: number;
  itemName: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, startIndex, itemName, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const showPrev = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const showNext = useCallback(() => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, showPrev, showNext]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = images[currentIndex];
    // Sanitize item name for filename
    const safeName = itemName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeName}_${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (!images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <img src={images[currentIndex]} alt={`${itemName} - Image ${currentIndex + 1}`} className="object-contain w-full h-full" />
        
        <button onClick={onClose} className="absolute top-2 right-2 text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition" aria-label="Close viewer">
          <CloseIcon className="w-6 h-6" />
        </button>

        {images.length > 1 && (
          <>
            <button onClick={showPrev} className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition" aria-label="Previous image">
              <ChevronLeftIcon className="w-8 h-8" />
            </button>
            <button onClick={showNext} className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition" aria-label="Next image">
              <ChevronRightIcon className="w-8 h-8" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 p-2 rounded-full">
           {images.length > 1 && (
             <span className="text-white text-sm font-medium">{currentIndex + 1} / {images.length}</span>
           )}
           <button onClick={handleDownload} className="flex items-center gap-2 text-white p-2 rounded-full hover:bg-black/80 transition" aria-label="Download image">
              <DownloadIcon className="w-6 h-6" />
           </button>
        </div>
      </div>
       <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-in-out;
          }
      `}</style>
    </div>
  );
};

export default ImageViewer;
