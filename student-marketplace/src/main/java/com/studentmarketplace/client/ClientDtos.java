package com.studentmarketplace.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/** JSON shapes of API_CONTRACT.md (the React frontend). Field names are exactly the ones the frontend uses. */
public final class ClientDtos {

    private ClientDtos() {
    }

    public record SellerDto(String id, String name, String avatarUrl, String faculty) {
    }

    /**
     * status: "active" (AVAILABLE), "sold", and two extra values the contract does not have:
     * "reserved" and "hidden" (hidden = the seller did not confirm the listing for 37 days).
     */
    public record ListingDto(String id, String title, String description, int price, String category,
                             String condition, List<String> images, String status, String sellerId,
                             SellerDto seller, String contact, LocalDate createdAt) {
    }

    /** Page numbers start at 1 (as in the contract). */
    public record ListingPage(List<ListingDto> items, long total, int page, int pageSize) {
    }

    /**
     * Body of POST and PUT /listings. sellerId and seller from the contract are ignored on purpose:
     * the seller is always the logged-in user. images: data URLs (data:image/png;base64,...) for new
     * pictures and the URLs the API returned earlier for pictures to keep, in the wanted order.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ListingRequest(
            @NotBlank @Size(min = 3, max = 120) String title,
            @Size(max = 2000) String description,
            @NotNull @Min(value = 1, message = "must be greater than 0") @Max(100_000_000) Integer price,
            @NotBlank String category,
            @NotBlank String condition,
            @Size(max = 5, message = "at most 5 images") List<String> images,
            @Size(max = 100) String contact) {
    }

    public record StatusRequest(@NotBlank String status) {
    }

    public record UserDto(String id, String name, String email, String avatarUrl, String faculty, Integer year,
                          String telegram, boolean emailVerified) {
    }

    /** Fields that are missing stay unchanged. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UserPatch(
            @Size(min = 1, max = 100) String name,
            @Size(max = 100) String faculty,
            @Min(1) @Max(8) Integer year,
            @Size(max = 64) String telegram) {
    }

    public record FavoriteState(@JsonProperty("isFavorite") boolean isFavorite) {
    }

    public record Success(boolean success) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RegisterRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 8, max = 72, message = "must be 8 to 72 characters") String password,
            @NotBlank @Size(max = 100) String name) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {
    }

    public record AuthResponse(String token, String tokenType, long expiresInSeconds, UserDto user) {
    }
}
