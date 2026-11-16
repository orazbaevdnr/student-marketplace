package com.studentmarketplace.photo;

public record PhotoResponse(Long id, int sortOrder, String url) {

    public static PhotoResponse from(ListingPhoto p, String listingId) {
        return new PhotoResponse(p.getId(), p.getSortOrder(),
                "/api/listings/" + listingId + "/photos/" + p.getId() + "/content");
    }
}
