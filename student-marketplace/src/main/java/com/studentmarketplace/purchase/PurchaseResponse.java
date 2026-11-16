package com.studentmarketplace.purchase;

import java.time.Instant;

public record PurchaseResponse(Long id, String listingId, String listingTitle, Long sellerId, String sellerName,
                               Long buyerId, String buyerName, int finalPriceKzt, Instant purchasedAt) {

    public static PurchaseResponse from(Purchase p) {
        return new PurchaseResponse(p.getId(), p.getListing().getId(), p.getListing().getTitle(),
                p.getListing().getSeller().getId(), p.getListing().getSeller().getDisplayName(),
                p.getBuyer().getId(), p.getBuyer().getDisplayName(), p.getFinalPriceKzt(), p.getPurchasedAt());
    }
}
