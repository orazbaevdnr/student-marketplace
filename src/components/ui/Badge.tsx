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
    sm: 'text-xs px-2.5 py-0.5 rounded-full font-medium',
    md: 'text-sm px-3 py-1 rounded-full font-medium',
  };

  let colorClasses = 'bg-slate-100 text-slate-700 border border-slate-200';
  let label = children;

  if (variant === 'condition' && condition) {
    label = strings.catalog.conditions[condition] || condition;
    switch (condition) {
      case 'new':
        colorClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        break;
      case 'like_new':
        colorClasses = 'bg-teal-50 text-teal-700 border border-teal-200';
        break;
      case 'good':
        colorClasses = 'bg-blue-50 text-blue-700 border border-blue-200';
        break;
      case 'fair':
        colorClasses = 'bg-amber-50 text-amber-700 border border-amber-200';
        break;
    }
  } else if (variant === 'status' && status) {
    if (status === 'sold') {
      label = strings.listingDetails.soldBadge;
      colorClasses = 'bg-slate-800 text-white font-semibold tracking-wider';
    } else {
      label = strings.listingDetails.activeBadge;
      colorClasses = 'bg-emerald-100 text-emerald-800 font-medium';
    }
  } else if (variant === 'category' && category) {
    label = strings.catalog.categories[category] || category;
    colorClasses = 'bg-indigo-50 text-indigo-700 border border-indigo-100';
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};
