package com.studentmarketplace.photo;

/** (listing, its main photo): lets a search page load all main photos with one query. */
public record MainPhotoRef(String listingId, Long photoId) {
}
