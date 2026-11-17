import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  fallbackLabel?: string;
  iconClassName?: string;
}

/**
 * Renders a real photo, or a local neutral placeholder when the URL is missing
 * or the image fails to load. Never calls an external placeholder service.
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackLabel,
  iconClassName = 'w-8 h-8',
  className = '',
  ...props
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex h-full w-full flex-col items-center justify-center gap-1.5 bg-chalk text-ink-300 ${className}`}
      >
        <ImageOff className={iconClassName} aria-hidden="true" />
        {fallbackLabel && (
          <span className="text-[11px] font-medium text-ink-400">{fallbackLabel}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
};
