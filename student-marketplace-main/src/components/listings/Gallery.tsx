import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface GalleryProps {
  images: string[];
  title: string;
}

export const Gallery: React.FC<GalleryProps> = ({ images, title }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Only real photos from the backend are rendered. No external placeholder service,
  // so the production CSP can stay at img-src 'self' data: blob:.
  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-2 text-slate-400">
        <ImageOff className="w-10 h-10" />
        <span className="text-xs font-medium">No photos yet</span>
      </div>
    );
  }

  const activeImage = images[selectedIndex] || images[0];

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs">
        <img
          src={activeImage}
          alt={`${title} - photo ${selectedIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-200"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative aspect-square w-16 sm:w-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                selectedIndex === idx
                  ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-xs'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
