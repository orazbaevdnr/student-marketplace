import { describe, it, expect } from 'vitest';
import { validateListingDraft, type ListingDraft } from './validation';

function makeDraft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  return {
    title: 'Calculus textbook',
    description: 'Minor wear on the cover, no notes inside.',
    price: '4500',
    category: 'textbooks',
    condition: 'good',
    contact: '@alex',
    ...overrides,
  };
}

describe('validateListingDraft', () => {
  it('rejects a title shorter than three characters', () => {
    const errors = validateListingDraft(makeDraft({ title: 'Hi' }));

    expect(errors.title).toBe('Must be at least 3 characters');
  });

  it('rejects an empty, negative or non-numeric price', () => {
    for (const price of ['', '-5', 'abc']) {
      const errors = validateListingDraft(makeDraft({ price }));
      expect(errors.price).toBe('Please enter a price of 1 or higher');
    }
  });

  it('returns no errors for a complete draft', () => {
    const errors = validateListingDraft(makeDraft());

    expect(errors).toEqual({});
  });
});
