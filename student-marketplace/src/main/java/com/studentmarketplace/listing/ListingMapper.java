package com.studentmarketplace.listing;

import com.studentmarketplace.listing.ListingDtos.Detail;
import com.studentmarketplace.listing.ListingDtos.Summary;
import com.studentmarketplace.photo.PhotoResponse;

import java.util.List;

final class ListingMapper {

    private ListingMapper() {
    }

    static Summary summary(Listing l, Long mainPhotoId) {
        return new Summary(l.getId(), l.getTitle(), l.getPriceKzt(), l.getStatus(),
                l.getCategory().getId(), l.getCategory().getName(),
                l.getSeller().getId(), l.getSeller().getDisplayName(),
                mainPhotoId, l.getLastUpdated());
    }

    static Detail detail(Listing l, List<PhotoResponse> photos) {
        return new Detail(l.getId(), l.getTitle(), l.getDescription(), l.getPriceKzt(), l.getStatus(),
                l.getCategory().getId(), l.getCategory().getName(),
                l.getSeller().getId(), l.getSeller().getDisplayName(),
                photos, l.getCreatedAt(), l.getLastUpdated());
    }
}
