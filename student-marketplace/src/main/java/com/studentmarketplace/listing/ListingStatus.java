package com.studentmarketplace.listing;

public enum ListingStatus {
    /** Visible to every buyer. */
    AVAILABLE,
    /** Set by the seller while an item is promised to someone. Not shown in search. */
    RESERVED,
    /** Set only by a purchase. Final. */
    SOLD,
    /** Set by the stale-listing job when the seller did not confirm the listing in time. */
    HIDDEN
}
