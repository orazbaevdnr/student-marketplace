import React from 'react';
import { SellerStats } from '../../api/types';
import { RatingIcons } from './RatingIcons';
import { SellerBadges } from './SellerBadges';
import { TagChips } from './TagChips';
import { getRatingColor } from '../../utils/reviews';
import { strings } from '../../i18n/strings';

interface RatingSummaryProps {
  stats: SellerStats;
  className?: string;
  compact?: boolean;
}

export const RatingSummary: React.FC<RatingSummaryProps> = ({
  stats,
  className = '',
  compact = false,
}) => {
  const isNew = stats.reviewCount < 3;
  const ratingColor = getRatingColor(stats.averageRating);

  if (compact) {
    if (isNew) {
      return (
        <div className={`inline-flex items-center gap-1.5 ${className}`}>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            🌱 {strings.reviews.newSeller}
          </span>
          <span className="text-xs text-gray-400">
            ({stats.reviewCount === 1 ? strings.reviews.singleReview : strings.reviews.reviewsCount.replace('{count}', String(stats.reviewCount))})
          </span>
        </div>
      );
    }

    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <RatingIcons value={stats.averageRating} size="sm" />
        <span className={`text-sm font-bold ${ratingColor}`}>
          {stats.averageRating.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500">
          ({strings.reviews.reviewsCount.replace('{count}', String(stats.reviewCount))})
        </span>
      </div>
    );
  }

  // Full detailed summary card
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Big score / New status */}
        <div className="md:col-span-5 text-center md:text-left md:border-r md:border-gray-100 md:pr-6">
          {isNew ? (
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                🌱 {strings.reviews.newSeller}
              </span>
              <p className="text-xs text-gray-500">
                {stats.reviewCount === 0
                  ? strings.reviews.noReviews
                  : strings.reviews.reviewsCount.replace('{count}', String(stats.reviewCount))}
              </p>
              {stats.reviewCount > 0 && (
                <div className="pt-2 flex justify-center md:justify-start">
                  <RatingIcons value={stats.averageRating} size="md" />
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className={`text-4xl font-extrabold ${ratingColor}`}>
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-sm font-medium text-gray-400">/ 5.0</span>
              </div>

              <div className="mt-1 flex justify-center md:justify-start">
                <RatingIcons value={stats.averageRating} size="md" />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                {strings.reviews.reviewsCount.replace(
                  '{count}',
                  String(stats.reviewCount)
                )}
              </p>
            </div>
          )}

          {/* Seller Badges */}
          {stats.badges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center md:justify-start">
              <SellerBadges badges={stats.badges} />
            </div>
          )}
        </div>

        {/* Right Column: 5 distribution bars (5 down to 1) */}
        <div className="md:col-span-7 space-y-2">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = stats.distribution[star] || 0;
            const pct =
              stats.reviewCount > 0
                ? Math.round((count / stats.reviewCount) * 100)
                : 0;

            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-6 font-medium text-gray-600 flex items-center justify-end gap-1">
                  {star}
                  <span className="text-amber-500 text-[10px]">🎓</span>
                </span>

                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="w-8 text-right font-medium text-gray-400">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top tags chips below */}
      {stats.topTags.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {strings.reviews.tagsLabel}
          </p>
          <TagChips tags={stats.topTags} />
        </div>
      )}
    </div>
  );
};
