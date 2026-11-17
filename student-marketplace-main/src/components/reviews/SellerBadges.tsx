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
    bg: 'bg-sun-50',
    text: 'text-sun-800',
    border: 'border-sun-300',
  },
  fast_responder: {
    icon: Zap,
    bg: 'bg-cobalt-50',
    text: 'text-cobalt-700',
    border: 'border-cobalt-200',
  },
  honest_listings: {
    icon: CheckCircle2,
    bg: 'bg-mint-50',
    text: 'text-mint-700',
    border: 'border-mint-200',
  },
  new_seller: {
    icon: Sparkles,
    bg: 'bg-ink-100',
    text: 'text-ink-700',
    border: 'border-ink-200',
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
            className={`inline-flex items-center gap-1 rounded-full font-semibold border ${config.bg} ${config.text} ${config.border} ${
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
