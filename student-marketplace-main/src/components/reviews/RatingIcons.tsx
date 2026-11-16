import React, { useState } from 'react';

// Graduation Cap Icon SVG path
export const GRADUATION_CAP_PATH =
  'M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-7 10.18v4L12 21l7-3.82v-4L12 17l-7-3.82z';

interface RatingIconsProps {
  value: number; // 0 to 5, can be fractional for display
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (val: 1 | 2 | 3 | 4 | 5) => void;
  className?: string;
  showValueLabel?: boolean;
}

const SIZE_MAP = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

export const RatingIcons: React.FC<RatingIconsProps> = ({
  value,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  className = '',
  showValueLabel = false,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayVal = interactive ? (hoverValue ?? value) : value;

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!interactive || !onChange) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(5, (value || 0) + 1) as 1 | 2 | 3 | 4 | 5;
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, (value || 1) - 1) as 1 | 2 | 3 | 4 | 5;
      onChange(prev);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange((index + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const iconSizeClass = SIZE_MAP[size];

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`Rating: ${value} out of ${max} graduation caps`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starIndex = i + 1;
        const fillPercentage = Math.max(
          0,
          Math.min(100, (displayVal - i) * 100)
        );

        if (interactive) {
          const isFilled = starIndex <= displayVal;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={value === starIndex}
              aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
              className={`p-1 rounded-md transition-transform focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:scale-110 ${
                isFilled ? 'text-amber-500' : 'text-gray-300'
              }`}
              onMouseEnter={() => setHoverValue(starIndex)}
              onMouseLeave={() => setHoverValue(null)}
              onClick={() => onChange && onChange(starIndex as 1 | 2 | 3 | 4 | 5)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            >
              <svg
                viewBox="0 0 24 24"
                className={`${iconSizeClass} fill-current transition-colors duration-150`}
              >
                <path d={GRADUATION_CAP_PATH} />
              </svg>
            </button>
          );
        }

        // Display mode (supports fractional fill via overlay)
        return (
          <div key={i} className={`relative inline-block ${iconSizeClass}`}>
            {/* Background empty cap */}
            <svg
              viewBox="0 0 24 24"
              className={`w-full h-full fill-gray-200 text-gray-200`}
            >
              <path d={GRADUATION_CAP_PATH} />
            </svg>

            {/* Foreground filled cap (clipped by width) */}
            {fillPercentage > 0 && (
              <div
                className="absolute top-0 left-0 h-full overflow-hidden text-amber-500 fill-amber-500"
                style={{ width: `${fillPercentage}%` }}
              >
                <svg viewBox="0 0 24 24" className={`${iconSizeClass} fill-current`}>
                  <path d={GRADUATION_CAP_PATH} />
                </svg>
              </div>
            )}
          </div>
        );
      })}

      {showValueLabel && (
        <span className="ml-1 text-sm font-semibold text-gray-700">
          {value > 0 ? value.toFixed(1) : '—'}
        </span>
      )}
    </div>
  );
};
