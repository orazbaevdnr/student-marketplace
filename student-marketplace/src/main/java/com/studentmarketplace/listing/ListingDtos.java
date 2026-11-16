package com.studentmarketplace.listing;

import com.studentmarketplace.photo.PhotoResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public final class ListingDtos {

    private ListingDtos() {
    }

    /**
     * Data rules from the Task 7 data dictionary: the price is a whole number of tenge greater than 0
     * (text such as "12 000 tg" is rejected), the title is required.
     */
    public record Request(
            @NotBlank @Size(min = 3, max = 120) String title,
            @Size(max = 2000) String description,
            @NotNull @Min(value = 1, message = "must be greater than 0") @Max(100_000_000) Integer priceKzt,
            @NotNull Long categoryId) {
    }

    public record StatusRequest(@NotNull ListingStatus status) {
    }

    /** Short form for search results and "my listings". */
    public record Summary(String id, String title, int priceKzt, ListingStatus status,
                          Long categoryId, String categoryName, Long sellerId, String sellerName,
                          Long mainPhotoId, LocalDate lastUpdated) {
    }

    public record Detail(String id, String title, String description, int priceKzt, ListingStatus status,
                         Long categoryId, String categoryName, Long sellerId, String sellerName,
                         List<PhotoResponse> photos, LocalDate createdAt, LocalDate lastUpdated) {
    }
}
