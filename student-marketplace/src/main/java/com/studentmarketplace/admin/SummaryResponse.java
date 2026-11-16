package com.studentmarketplace.admin;

import com.studentmarketplace.listing.ListingStatus;

import java.util.Map;

public record SummaryResponse(Map<ListingStatus, Long> listingsByStatus, long users, long purchases) {
}
