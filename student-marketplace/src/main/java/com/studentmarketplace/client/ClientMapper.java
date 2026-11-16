package com.studentmarketplace.client;

import com.studentmarketplace.client.ClientDtos.ListingDto;
import com.studentmarketplace.client.ClientDtos.SellerDto;
import com.studentmarketplace.client.ClientDtos.UserDto;
import com.studentmarketplace.listing.Listing;
import com.studentmarketplace.listing.ListingStatus;
import com.studentmarketplace.photo.ListingPhoto;
import com.studentmarketplace.user.User;

import java.util.List;

final class ClientMapper {

    private ClientMapper() {
    }

    static String status(ListingStatus status) {
        return switch (status) {
            case AVAILABLE -> "active";
            case RESERVED -> "reserved";
            case SOLD -> "sold";
            case HIDDEN -> "hidden";
        };
    }

    /** Absolute URL, because the frontend runs on another port and cannot use a relative one. */
    static String imageUrl(String baseUrl, String listingId, Long photoId) {
        return baseUrl + "/api/listings/" + listingId + "/photos/" + photoId + "/content";
    }

    static SellerDto seller(User u) {
        return new SellerDto(u.getPublicId(), u.getDisplayName(), u.getAvatarUrl(), u.getFaculty());
    }

    static ListingDto listing(Listing l, List<ListingPhoto> photos, boolean showContact, String baseUrl) {
        return new ListingDto(l.getId(), l.getTitle(), l.getDescription() == null ? "" : l.getDescription(),
                l.getPriceKzt(), l.getCategory().getSlug(), l.getCondition().api(),
                photos.stream().map(p -> imageUrl(baseUrl, l.getId(), p.getId())).toList(),
                status(l.getStatus()), l.getSeller().getPublicId(), seller(l.getSeller()),
                showContact ? l.getContact() : null, l.getCreatedAt());
    }

    static UserDto user(User u, boolean includeEmail) {
        return new UserDto(u.getPublicId(), u.getDisplayName(), includeEmail ? u.getUniversityEmail() : null,
                u.getAvatarUrl(), u.getFaculty(), u.getStudyYear(), u.getTelegram(), u.isEmailVerified());
    }
}
