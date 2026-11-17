import React from 'react';
import { ReviewTag } from '../../api/types';
import { POSITIVE_TAGS } from '../../utils/reviews';
import { strings } from '../../i18n/strings';

interface TagChipsProps {
  tags: ReviewTag[];
  selectedTags?: ReviewTag[];
  interactive?: boolean;
  onToggleTag?: (tag: ReviewTag) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const TagChips: React.FC<TagChipsProps> = ({
  tags,
  selectedTags = [],
  interactive = false,
  onToggleTag,
  size = 'sm',
  className = '',
}) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => {
        const isPositive = POSITIVE_TAGS.includes(tag);
        const isSelected = selectedTags.includes(tag);
        const label = strings.reviews.tags[tag] || tag;

        if (interactive) {
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag && onToggleTag(tag)}
              aria-pressed={isSelected}
              className={`inline-flex items-center rounded-full font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-1 ${
                size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
              } ${
                isSelected
                  ? isPositive
                    ? 'bg-mint-600 text-white'
                    : 'bg-coral-600 text-white'
                  : 'bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200'
              }`}
            >
              <span>{label}</span>
            </button>
          );
        }

        // Display mode
        return (
          <span
            key={tag}
            className={`inline-flex items-center rounded-full font-semibold ${
              size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
            } ${
              isPositive
                ? 'bg-mint-50 text-mint-700 border border-mint-200'
                : 'bg-coral-50 text-coral-700 border border-coral-200'
            }`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
};
