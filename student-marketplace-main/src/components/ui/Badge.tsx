import React from 'react';
import { Category, Condition, ListingStatus } from '../../api/types';
import { strings } from '../../i18n/strings';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'condition' | 'status' | 'category' | 'default';
  condition?: Condition;
  status?: ListingStatus;
  category?: Category;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  condition,
  status,
  category,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 rounded-full font-semibold',
    md: 'text-sm px-3 py-1 rounded-full font-semibold',
  };

  let colorClasses = 'bg-ink-100 text-ink-700 border border-ink-200';
  let label = children;

  if (variant === 'condition' && condition) {
    label = strings.catalog.conditions[condition] || condition;
    switch (condition) {
      case 'new':
        colorClasses = 'bg-mint-50 text-mint-700 border border-mint-200';
        break;
      case 'like_new':
        colorClasses = 'bg-mint-50 text-mint-700 border border-mint-200';
        break;
      case 'good':
        colorClasses = 'bg-cobalt-50 text-cobalt-700 border border-cobalt-200';
        break;
      case 'fair':
        colorClasses = 'bg-sun-50 text-sun-800 border border-sun-200';
        break;
    }
  } else if (variant === 'status' && status) {
    if (status === 'sold') {
      label = strings.listingDetails.soldBadge;
      colorClasses = 'bg-ink-800 text-white font-semibold';
    } else if (status === 'reserved') {
      label = strings.listingDetails.reservedBadge;
      colorClasses = 'bg-sun-100 text-sun-800 font-semibold';
    } else if (status === 'hidden') {
      label = strings.listingDetails.hiddenBadge;
      colorClasses = 'bg-ink-200 text-ink-600 border border-ink-300 font-semibold';
    } else {
      label = strings.listingDetails.activeBadge;
      colorClasses = 'bg-mint-100 text-mint-800 font-semibold';
    }
  } else if (variant === 'category' && category) {
    label = strings.catalog.categories[category] || category;
    colorClasses = 'bg-cobalt-50 text-cobalt-700 border border-cobalt-100';
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};
