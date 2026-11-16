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
              className={`inline-flex items-center rounded-full font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
              } ${
                isSelected
                  ? isPositive
                    ? 'bg-emerald-600 text-white shadow-sm ring-emerald-500'
                    : 'bg-rose-600 text-white shadow-sm ring-rose-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <span>{isPositive ? '✓ ' : '✕ '}</span>
              <span>{label}</span>
            </button>
          );
        }

        // Display mode
        return (
          <span
            key={tag}
            className={`inline-flex items-center rounded-full font-medium ${
              size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
            } ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
};
