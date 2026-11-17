import type { Review, ReviewTag, SellerBadge, SellerStats } from '../api/types';

// ---- Graduation Cap SVG (inline, used as rating icon) ----
export const RATING_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
  <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
</svg>`;

// ---- Tag groups ----
export const POSITIVE_TAGS: ReviewTag[] = [
  'as_described',
  'fast_reply',
  'fair_price',
  'on_time',
  'friendly',
];

export const NEGATIVE_TAGS: ReviewTag[] = [
  'not_as_described',
  'slow_reply',
  'late',
  'overpriced',
];

/**
 * Returns available tags based on the selected rating:
 * rating >= 4 → positive only
 * rating <= 2 → negative only
 * rating === 3 → both
 */
export function getAvailableTags(rating: number): ReviewTag[] {
  if (rating >= 4) return POSITIVE_TAGS;
  if (rating <= 2) return NEGATIVE_TAGS;
  return [...POSITIVE_TAGS, ...NEGATIVE_TAGS];
}

// ---- Rating level labels ----
export const RATING_LABELS: Record<number, string> = {
  1: 'Bad',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

// ---- Rating color ----
export function getRatingColor(avg: number): string {
  if (avg >= 4.5) return 'text-mint-600';
  if (avg >= 3.5) return 'text-sun-700';
  if (avg >= 2.5) return 'text-sun-800';
  return 'text-coral-600';
}

export function getRatingBg(avg: number): string {
  if (avg >= 4.5) return 'bg-mint-100 text-mint-800';
  if (avg >= 3.5) return 'bg-sun-100 text-sun-800';
  if (avg >= 2.5) return 'bg-sun-50 text-sun-800';
  return 'bg-coral-100 text-coral-800';
}

// ---- Compute stats ----
export function computeSellerStats(reviews: Review[]): SellerStats {
  const reviewCount = reviews.length;

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  };

  let ratingSum = 0;
  const tagCounts: Partial<Record<ReviewTag, number>> = {};

  for (const r of reviews) {
    ratingSum += r.rating;
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    for (const tag of r.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const averageRating = reviewCount > 0 ? Math.round((ratingSum / reviewCount) * 10) / 10 : 0;

  // top tags sorted by frequency
  const topTags = (Object.entries(tagCounts) as [ReviewTag, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  // Badges
  const badges: SellerBadge[] = [];
  if (reviewCount < 3) {
    badges.push('new_seller');
  } else {
    if (averageRating >= 4.5) badges.push('trusted_seller');
    if ((tagCounts['fast_reply'] || 0) >= 3) badges.push('fast_responder');
    if ((tagCounts['as_described'] || 0) >= 3) badges.push('honest_listings');
  }

  return { reviewCount, averageRating, distribution, topTags, badges };
}

// ---- HTML sanitize (strip tags) ----
export function sanitizeText(raw: string): string {
  return raw
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;')
    .trim();
}
