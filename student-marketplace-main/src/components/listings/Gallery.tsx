import React, { useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Lightbox } from './Lightbox';
import { SafeImage } from '../ui/SafeImage';

interface GalleryProps {
  images: string[];
  title: string;
}

const SWIPE_THRESHOLD = 50;

export const Gallery: React.FC<GalleryProps> = ({ images, title }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [dragX, setDragX] = useState(0);

  const dragStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  // A listing with no photos renders the local placeholder and never opens the viewer.
  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl overflow-hidden border border-ink-200 bg-chalk">
        <SafeImage
          src={null}
          alt={`${title} — no photos`}
          fallbackLabel="No photos yet"
          iconClassName="w-10 h-10"
        />
      </div>
    );
  }

  const activeIndex = Math.min(selectedIndex, images.length - 1);
  const activeImage = images[activeIndex];
  const hasMultiple = images.length > 1;

  const goTo = (index: number) => {
    setSelectedIndex(index);
    setDragX(0);
  };

  const goNext = () => {
    setSelectedIndex((current) => (current + 1) % images.length);
    setDragX(0);
  };

  const goPrev = () => {
    setSelectedIndex((current) => (current - 1 + images.length) % images.length);
    setDragX(0);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasMultiple) return;
    dragStartX.current = event.clientX;
    didSwipe.current = false;
    setDragX(0);
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom has no pointer capture.
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const delta = event.clientX - dragStartX.current;
    if (Math.abs(delta) > 10) didSwipe.current = true;
    setDragX(delta);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const delta = event.clientX - dragStartX.current;
    dragStartX.current = null;
    setDragX(0);

    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Ignore missing pointer capture support.
    }

    if (delta <= -SWIPE_THRESHOLD) {
      goNext();
      didSwipe.current = true;
    } else if (delta >= SWIPE_THRESHOLD) {
      goPrev();
      didSwipe.current = true;
    }
  };

  const handleOpen = () => {
    // A completed swipe ends with a click; do not treat it as "expand".
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    setIsLightboxOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen();
    }
  };

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-chalk border border-ink-200">
        <div
          role="button"
          tabIndex={0}
          aria-label="Open photo viewer"
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="block w-full h-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt-500"
          style={{ touchAction: hasMultiple ? 'pan-y' : 'auto' }}
        >
          <SafeImage
            src={activeImage}
            alt={`${title} - photo ${activeIndex + 1}`}
            fallbackLabel="Photo unavailable"
            iconClassName="w-9 h-9"
            className="w-full h-full object-cover select-none transition-transform duration-200"
            style={{
              transform: `translateX(${dragX}px)`,
              transition: dragX === 0 ? 'transform 180ms ease-out' : 'none',
            }}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>

        {/* Expand control for touch and discoverability */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsLightboxOpen(true);
          }}
          aria-label="Expand photo"
          className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/55 text-white backdrop-blur-sm transition-colors hover:bg-ink-950/75 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        >
          <Maximize2 className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Position indicator */}
        {hasMultiple && (
          <span
            aria-live="polite"
            className="absolute bottom-3 right-3 z-10 rounded-full bg-ink-950/65 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm [font-variant-numeric:tabular-nums]"
          >
            {activeIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiple && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={`relative aspect-square w-16 sm:w-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 ${
                index === activeIndex
                  ? 'border-cobalt-600 opacity-100'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <SafeImage
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fallbackLabel=""
                iconClassName="w-4 h-4"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen && (
        <Lightbox
          images={images}
          startIndex={activeIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
};
