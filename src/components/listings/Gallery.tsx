import React, { useState } from 'react';

interface GalleryProps {
  images: string[];
  title: string;
}

export const Gallery: React.FC<GalleryProps> = ({ images, title }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayImages = images.length > 0 ? images : ['https://picsum.photos/seed/default/800/600'];
  const activeImage = displayImages[selectedIndex] || displayImages[0];

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
      {displayImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {displayImages.map((img, idx) => (
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
