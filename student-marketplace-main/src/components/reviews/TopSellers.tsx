import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ChevronRight } from 'lucide-react';
import { User, SellerStats } from '../../api/types';
import { RatingIcons } from './RatingIcons';
import { SellerBadges } from './SellerBadges';
import { getInitials } from '../../utils/format';
import { SafeImage } from '../ui/SafeImage';

export interface TopSellerItem {
  user: User;
  stats: SellerStats;
  activeListingsCount: number;
}

interface TopSellersProps {
  sellers: TopSellerItem[];
  className?: string;
}

export const TopSellers: React.FC<TopSellersProps> = ({ sellers, className = '' }) => {
  if (!sellers || sellers.length === 0) return null;

  return (
    <div className={`bg-surface rounded-2xl border border-ink-200 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sun-400 text-ink-900">
            <Award className="w-4 h-4" />
          </div>
          <h3 className="font-display text-base font-bold text-ink-900">
            Top student sellers
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {sellers.map(({ user, stats }) => (
          <Link
            key={user.id}
            to={`/seller/${user.id}`}
            className="flex items-center justify-between p-3 rounded-xl bg-chalk border border-ink-200 hover:border-cobalt-300 hover:bg-cobalt-50/30 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              {user.avatarUrl ? (
                <SafeImage
                  src={user.avatarUrl}
                  alt={user.name}
                  fallbackLabel=""
                  iconClassName="w-4 h-4"
                  className="w-10 h-10 rounded-full object-cover border border-ink-100"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-cobalt-100 text-cobalt-700 font-semibold flex items-center justify-center text-xs">
                  {getInitials(user.name)}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate group-hover:text-cobalt-700 transition-colors">
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <RatingIcons value={stats.averageRating} size="sm" />
                  <span className="text-xs font-bold text-ink-700">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'New'}
                  </span>
                </div>
                <div className="mt-1">
                  <SellerBadges badges={stats.badges.slice(0, 1)} size="sm" />
                </div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-cobalt-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </Link>
        ))}
      </div>
    </div>
  );
};
