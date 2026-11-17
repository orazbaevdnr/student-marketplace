import { describe, it, expect } from 'vitest';
import { MockApiClient } from './mockAdapter';
import type { Listing, Review } from './types';

const LISTINGS_KEY = 'student_marketplace_listings_live_v2';

function makeListing(overrides: Partial<Listing> & { id: string }): Listing {
  return {
    title: overrides.id,
    description: '',
    price: 1000,
    category: 'textbooks',
    condition: 'good',
    images: [],
    status: 'active',
    sellerId: 'seller-1',
    seller: { id: 'seller-1', name: 'Student Seller' },
    contact: '@seller',
    createdAt: '2026-11-01T10:00:00.000Z',
    ...overrides,
  };
}

function seedListings(listings: Listing[]): void {
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}

type ReviewInput = Omit<Review, 'id' | 'createdAt' | 'updatedAt'>;

function makeReviewInput(overrides: Partial<ReviewInput> = {}): ReviewInput {
  return {
    sellerId: 'seller-1',
    reviewerId: 'reviewer-1',
    listingId: 'listing-1',
    listingTitle: 'Calculus textbook',
    reviewerName: 'Student Reviewer',
    rating: 5,
    tags: [],
    comment: 'Smooth exchange.',
    ...overrides,
  };
}

describe('MockApiClient', () => {
  it('filters listings by category and inclusive price range', async () => {
    seedListings([
      makeListing({ id: 'listing-a', category: 'textbooks', price: 1000 }),
      makeListing({ id: 'listing-b', category: 'textbooks', price: 2500 }),
      makeListing({ id: 'listing-c', category: 'electronics', price: 1500 }),
      makeListing({ id: 'listing-d', category: 'textbooks', price: 3000 }),
    ]);
    const client = new MockApiClient();

    const result = await client.getListings({
      category: 'textbooks',
      minPrice: 1000,
      maxPrice: 2500,
    });

    expect(result.items.map((listing) => listing.id)).toEqual([
      'listing-a',
      'listing-b',
    ]);
    expect(result.total).toBe(2);
  });

  it('sorts listings by price ascending, price descending and newest', async () => {
    seedListings([
      makeListing({
        id: 'listing-old',
        price: 300,
        createdAt: '2026-11-01T10:00:00.000Z',
      }),
      makeListing({
        id: 'listing-mid',
        price: 100,
        createdAt: '2026-11-05T10:00:00.000Z',
      }),
      makeListing({
        id: 'listing-new',
        price: 200,
        createdAt: '2026-11-10T10:00:00.000Z',
      }),
    ]);
    const client = new MockApiClient();

    const ascending = await client.getListings({ sort: 'price_asc' });
    const descending = await client.getListings({ sort: 'price_desc' });
    const newest = await client.getListings({ sort: 'newest' });

    expect(ascending.items.map((listing) => listing.id)).toEqual([
      'listing-mid',
      'listing-new',
      'listing-old',
    ]);
    expect(descending.items.map((listing) => listing.id)).toEqual([
      'listing-old',
      'listing-new',
      'listing-mid',
    ]);
    expect(newest.items.map((listing) => listing.id)).toEqual([
      'listing-new',
      'listing-mid',
      'listing-old',
    ]);
  });

  it('toggles a favorite on and off for a user', async () => {
    seedListings([makeListing({ id: 'listing-1' })]);
    const client = new MockApiClient();

    await expect(client.toggleFavorite('user-1', 'listing-1')).resolves.toEqual({
      isFavorite: true,
    });
    const afterAdd = await client.getFavorites('user-1');
    expect(afterAdd.map((listing) => listing.id)).toEqual(['listing-1']);

    await expect(client.toggleFavorite('user-1', 'listing-1')).resolves.toEqual({
      isFavorite: false,
    });
    const afterRemove = await client.getFavorites('user-1');
    expect(afterRemove).toEqual([]);
  });

  it('rejects a review where the reviewer is the seller', async () => {
    const client = new MockApiClient();

    await expect(
      client.createReview(makeReviewInput({ reviewerId: 'seller-1' }))
    ).rejects.toThrow('You cannot review your own listing');
  });

  it('rejects a second review by the same reviewer for the same listing', async () => {
    const client = new MockApiClient();

    await client.createReview(makeReviewInput());

    await expect(client.createReview(makeReviewInput())).rejects.toThrow(
      'You have already reviewed this seller for this listing'
    );
  });
});
