import React from 'react';
import { Award, Zap, CheckCircle2, Sparkles } from 'lucide-react';
import { SellerBadge } from '../../api/types';
import { strings } from '../../i18n/strings';

interface SellerBadgesProps {
  badges: SellerBadge[];
  className?: string;
  size?: 'sm' | 'md';
}

const BADGE_CONFIG: Record<
  SellerBadge,
  {
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    text: string;
    border: string;
  }
> = {
  trusted_seller: {
    icon: Award,
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  fast_responder: {
    icon: Zap,
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-300',
  },
  honest_listings: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
  },
  new_seller: {
    icon: Sparkles,
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
  },
};

export const SellerBadges: React.FC<SellerBadgesProps> = ({
  badges,
  className = '',
  size = 'sm',
}) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {badges.map((b) => {
        const config = BADGE_CONFIG[b];
        if (!config) return null;
        const Icon = config.icon;
        const label = strings.reviews.badges[b] || b;
        const desc = strings.reviews.badgeDesc[b] || '';

        return (
          <span
            key={b}
            title={desc}
            className={`inline-flex items-center gap-1 rounded-full font-medium border ${config.bg} ${config.text} ${config.border} ${
              size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
            }`}
          >
            <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
};
