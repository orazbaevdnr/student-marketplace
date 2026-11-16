package com.studentmarketplace.admin;

import java.time.LocalDate;

/** One row of the "stale listings" report: the SQL query from the Task 9 plan. */
public record StaleListingRow(String listingId, String sellerName, int priceKzt, LocalDate lastUpdated) {
}
