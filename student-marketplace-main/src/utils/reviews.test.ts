import { describe, it, expect } from 'vitest';
import { computeSellerStats } from './reviews';
import type { Review, ReviewTag } from '../api/types';

function makeReview(
  id: string,
  rating: 1 | 2 | 3 | 4 | 5,
  tags: ReviewTag[] = []
): Review {
  return {
    id,
    sellerId: 'seller-1',
    reviewerId: `reviewer-${id}`,
    listingId: `listing-${id}`,
    listingTitle: 'Calculus textbook',
    reviewerName: 'Student Reviewer',
    rating,
    tags,
    comment: '',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  };
}

describe('computeSellerStats', () => {
  it('returns the review count and the rounded average rating', () => {
    const stats = computeSellerStats([
      makeReview('1', 5),
      makeReview('2', 4),
      makeReview('3', 4),
      makeReview('4', 3),
      makeReview('5', 5),
    ]);

    expect(stats.reviewCount).toBe(5);
    expect(stats.averageRating).toBe(4.2);
  });

  it('returns 0 (not null) with no reviews and awards only the new seller badge below three reviews', () => {
    const noReviews = computeSellerStats([]);
    const twoReviews = computeSellerStats([makeReview('1', 5), makeReview('2', 5)]);

    expect(noReviews.averageRating).toBe(0);
    expect(noReviews.averageRating).not.toBeNull();
    expect(typeof twoReviews.averageRating).toBe('number');
    expect(twoReviews.badges).toEqual(['new_seller']);
  });

  it('awards trusted_seller from three reviews at 4.5 or more, but not from two', () => {
    const threeReviews = computeSellerStats([
      makeReview('1', 5),
      makeReview('2', 5),
      makeReview('3', 4),
    ]);
    const twoReviews = computeSellerStats([makeReview('1', 5), makeReview('2', 5)]);

    expect(threeReviews.badges).toContain('trusted_seller');
    expect(twoReviews.badges).not.toContain('trusted_seller');
  });

  it('counts the distribution and orders at most five top tags by frequency', () => {
    const stats = computeSellerStats([
      makeReview('1', 5, ['fast_reply', 'as_described']),
      makeReview('2', 4, ['fast_reply', 'as_described']),
      makeReview('3', 4, ['fast_reply', 'friendly']),
    ]);

    expect(stats.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 });
    expect(stats.topTags).toEqual(['fast_reply', 'as_described', 'friendly']);
    expect(stats.topTags.length).toBeLessThanOrEqual(5);
  });
});
