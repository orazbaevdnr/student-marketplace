import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface LightboxProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}

const SWIPE_THRESHOLD = 50;
const DRAG_TOLERANCE = 5;

function clampIndex(index: number, length: number): number {
  if (length === 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

function prefersReducedMotion(): boolean {
  try {
    return Boolean(
      typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

export const Lightbox: React.FC<LightboxProps> = ({ images, startIndex, onClose }) => {
  const safeStart = clampIndex(startIndex, images.length);
  const [index, setIndex] = useState(safeStart);
  const [dragX, setDragX] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dragStartX = useRef<number | null>(null);
  const dragXRef = useRef(0);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const reducedMotion = useRef(prefersReducedMotion());

  const total = images.length;
  const hasMultiple = total > 1;

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(((next % total) + total) % total);
      setDragX(0);
      dragXRef.current = 0;
    },
    [total]
  );

  const goNext = useCallback(() => {
    setIndex((current) => (total === 0 ? 0 : (current + 1) % total));
    setDragX(0);
    dragXRef.current = 0;
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((current) => (total === 0 ? 0 : (current - 1 + total) % total));
    setDragX(0);
    dragXRef.current = 0;
  }, [total]);

  // Body scroll lock: restore whatever value was there before, not 'unset'.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Move focus into the dialog and return it to the opener on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const focusTarget = closeButtonRef.current || dialogRef.current;
    focusTarget?.focus?.();
    return () => {
      opener?.focus?.();
    };
  }, []);

  // Keyboard navigation and a simple focus trap.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
        return;
      }
      if (event.key === 'Tab') {
        const node = dialogRef.current;
        if (!node) return;
        const focusable = Array.from(
          node.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === node)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [goNext, goPrev, onClose]);

  // Preload the neighbouring photos.
  useEffect(() => {
    if (total < 2 || typeof window === 'undefined' || typeof window.Image !== 'function') {
      return;
    }
    const neighbours = [images[(index + 1) % total], images[(index - 1 + total) % total]];
    const preloaders = neighbours.map((src) => {
      const img = new window.Image();
      img.src = src;
      return img;
    });
    return () => {
      preloaders.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [images, index, total]);

  // Keep the active thumbnail visible; jsdom has no scrollIntoView.
  useEffect(() => {
    const node = thumbRefs.current[index];
    if (node && typeof node.scrollIntoView === 'function') {
      try {
        node.scrollIntoView({
          block: 'nearest',
          inline: 'center',
          behavior: reducedMotion.current ? 'auto' : 'smooth',
        });
      } catch {
        // Older browsers may reject the options object.
      }
    }
  }, [index]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasMultiple) return;
    // The arrows sit inside the stage. Capturing the pointer on the stage would
    // retarget pointerup (and therefore the click) to the stage, so the arrow
    // never receives its click and the viewer closes instead of advancing.
    if ((event.target as HTMLElement | null)?.closest('button')) return;
    isDragging.current = true;
    didDrag.current = false;
    dragStartX.current = event.clientX;
    dragXRef.current = 0;
    setDragX(0);
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and older browsers do not implement pointer capture.
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || dragStartX.current === null) return;
    const delta = event.clientX - dragStartX.current;
    dragXRef.current = delta;
    if (Math.abs(delta) > DRAG_TOLERANCE) {
      didDrag.current = true;
    }
    setDragX(delta);
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    dragStartX.current = null;

    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Ignore missing pointer capture support.
    }

    const delta = dragXRef.current;
    dragXRef.current = 0;
    setDragX(0);

    if (delta <= -SWIPE_THRESHOLD) {
      goNext();
    } else if (delta >= SWIPE_THRESHOLD) {
      goPrev();
    }
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleStageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // A swipe ends with a click on the stage; do not treat it as "close".
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (total === 0) return null;

  const currentImage = images[index];
  const imageTransition = reducedMotion.current || isDragging.current
    ? 'none'
    : 'transform 180ms ease-out';

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      tabIndex={-1}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex flex-col bg-ink-950/95 text-white outline-none"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="text-sm font-semibold text-white/80 [font-variant-numeric:tabular-nums]">
          {index + 1} / {total}
        </p>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Stage */}
      <div
        data-testid="lightbox-surface"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onClick={handleStageClick}
        className={`relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16 ${
          hasMultiple ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        style={{ touchAction: hasMultiple ? 'pan-y' : 'auto' }}
      >
        {hasMultiple && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous photo"
            className="absolute left-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white sm:left-5"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
        )}

        <img
          src={currentImage}
          alt={`Listing photo ${index + 1} of ${total}`}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain"
          style={{
            transform: `translateX(${dragX}px)`,
            transition: imageTransition,
          }}
        />

        {hasMultiple && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next photo"
            className="absolute right-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white sm:right-5"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Counter for screen readers and thumbnails */}
      <div className="px-4 pb-4 pt-2 sm:px-6">
        <p className="sr-only" aria-live="polite">
          Photo {index + 1} of {total}
        </p>

        {hasMultiple && (
          <div className="scrollbar-none mx-auto flex max-w-3xl items-center justify-start gap-2 overflow-x-auto sm:justify-center">
            {images.map((image, imageIndex) => (
              <button
                key={`${image}-${imageIndex}`}
                ref={(node) => {
                  thumbRefs.current[imageIndex] = node;
                }}
                type="button"
                onClick={() => goTo(imageIndex)}
                aria-label={`Go to photo ${imageIndex + 1}`}
                aria-current={imageIndex === index ? 'true' : undefined}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ${
                  imageIndex === index
                    ? 'border-white opacity-100'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={image}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
