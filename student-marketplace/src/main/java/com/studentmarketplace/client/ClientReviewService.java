package com.studentmarketplace.client;

import com.studentmarketplace.client.ClientDtos.ReviewDto;
import com.studentmarketplace.client.ClientDtos.ReviewPage;
import com.studentmarketplace.client.ClientDtos.ReviewPatch;
import com.studentmarketplace.client.ClientDtos.ReviewRequest;
import com.studentmarketplace.client.ClientDtos.SellerProfileDto;
import com.studentmarketplace.client.ClientDtos.SellerStatsDto;
import com.studentmarketplace.common.Exceptions.BadRequestException;
import com.studentmarketplace.common.Exceptions.ConflictException;
import com.studentmarketplace.common.Exceptions.ForbiddenException;
import com.studentmarketplace.common.Exceptions.NotFoundException;
import com.studentmarketplace.listing.Listing;
import com.studentmarketplace.listing.ListingRepository;
import com.studentmarketplace.listing.ListingStatus;
import com.studentmarketplace.review.Review;
import com.studentmarketplace.review.ReviewRepository;
import com.studentmarketplace.security.AppUserPrincipal;
import com.studentmarketplace.user.User;
import com.studentmarketplace.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Reviews of the frontend contract: shared by all devices because they live in PostgreSQL. */
@Service
public class ClientReviewService {

    /** Tag codes accepted from the frontend (see ReviewTag in src/api/types.ts). */
    private static final Set<String> ALLOWED_TAGS = Set.of(
            "as_described", "fast_reply", "fair_price", "on_time", "friendly",
            "not_as_described", "slow_reply", "late", "overpriced");

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final ReviewRepository reviews;
    private final UserRepository users;
    private final ListingRepository listings;

    public ClientReviewService(ReviewRepository reviews, UserRepository users, ListingRepository listings) {
        this.reviews = reviews;
        this.users = users;
        this.listings = listings;
    }

    @Transactional(readOnly = true)
    public ReviewPage list(String sellerId, String reviewerId, String listingId, Integer page, Integer pageSize) {
        int requestedPage = page == null ? 1 : Math.max(1, page);
        int requestedSize = pageSize == null ? DEFAULT_PAGE_SIZE : Math.min(MAX_PAGE_SIZE, Math.max(1, pageSize));
        Page<Review> found = reviews.search(parseId(sellerId, "sellerId"), parseId(reviewerId, "reviewerId"),
                blankToNull(listingId),
                PageRequest.of(requestedPage - 1, requestedSize,
                        Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"))));
        return new ReviewPage(found.getContent().stream().map(ClientReviewService::dto).toList(),
                found.getTotalElements(), requestedPage, requestedSize);
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> sellerReviews(String sellerId) {
        User seller = requireUser(sellerId);
        return reviews.findBySellerIdOrderByCreatedAtDesc(seller.getId()).stream()
                .map(ClientReviewService::dto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewDto mine(AppUserPrincipal me, String reviewerId, String listingId) {
        String wantedReviewer = blankToNull(reviewerId);
        if (wantedReviewer != null && !wantedReviewer.equals(String.valueOf(me.id()))) {
            throw new ForbiddenException("You can only read your own review");
        }
        if (listingId == null || listingId.isBlank()) {
            throw new BadRequestException("listingId is required");
        }
        return reviews.findByReviewerIdAndListingId(me.id(), listingId)
                .map(ClientReviewService::dto)
                .orElseThrow(() -> new NotFoundException("Review not found"));
    }

    @Transactional
    public ReviewDto create(AppUserPrincipal me, ReviewRequest request) {
        User reviewer = requireUser(String.valueOf(me.id()));
        Listing listing = listings.findWithRelationsById(request.listingId())
                .orElseThrow(() -> new NotFoundException("Listing " + request.listingId() + " not found"));
        User seller = listing.getSeller();
        if (seller.getId().equals(reviewer.getId())) {
            throw new BadRequestException("You cannot review your own listing");
        }
        if (reviews.findByReviewerIdAndListingId(reviewer.getId(), listing.getId()).isPresent()) {
            throw new ConflictException("You have already reviewed this listing");
        }
        Review review = new Review(seller, reviewer, listing, request.rating(),
                encodeTags(request.tags()), blankToNull(request.comment()), Instant.now());
        return dto(reviews.save(review));
    }

    @Transactional
    public ReviewDto update(AppUserPrincipal me, String id, ReviewPatch patch) {
        Review review = requireReview(id);
        requireAuthor(me, review);
        review.update(patch.rating(),
                patch.tags() == null ? null : encodeTags(patch.tags()),
                patch.comment() == null ? null : blankToNull(patch.comment()),
                Instant.now());
        return dto(review);
    }

    @Transactional
    public void delete(AppUserPrincipal me, String id) {
        Review review = requireReview(id);
        requireAuthor(me, review);
        reviews.delete(review);
    }

    @Transactional(readOnly = true)
    public SellerProfileDto sellerProfile(String sellerId) {
        User seller = requireUser(sellerId);
        List<Review> sellerReviews = reviews.findBySellerIdOrderByCreatedAtDesc(seller.getId());
        return new SellerProfileDto(
                ClientMapper.user(seller, false),
                stats(sellerReviews),
                listings.countBySellerIdAndStatus(seller.getId(), ListingStatus.AVAILABLE),
                listings.countBySellerIdAndStatus(seller.getId(), ListingStatus.SOLD));
    }

    // ---- helpers ----------------------------------------------------------

    private Review requireReview(String id) {
        Long reviewId = parseId(id, "review id");
        if (reviewId == null) {
            throw new NotFoundException("Review " + id + " not found");
        }
        return reviews.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review " + id + " not found"));
    }

    private void requireAuthor(AppUserPrincipal me, Review review) {
        if (!review.getReviewer().getId().equals(me.id()) && !me.isAdmin()) {
            throw new ForbiddenException("You can only change your own review");
        }
    }

    private User requireUser(String id) {
        Long userId = parseId(id, "userId");
        if (userId == null) {
            throw new NotFoundException("User " + id + " not found");
        }
        return users.findById(userId)
                .orElseThrow(() -> new NotFoundException("User " + id + " not found"));
    }

    private static Long parseId(String raw, String field) {
        String value = blankToNull(raw);
        if (value == null) {
            return null;
        }
        if (value.length() > 18 || !value.chars().allMatch(Character::isDigit)) {
            throw new BadRequestException(field + " must be a numeric id");
        }
        return Long.valueOf(value);
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Validates, removes duplicates and stores the tags as "fast_reply,on_time". */
    private static String encodeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }
        Set<String> unique = new LinkedHashSet<>();
        for (String tag : tags) {
            String code = tag == null ? "" : tag.trim();
            if (!ALLOWED_TAGS.contains(code)) {
                throw new BadRequestException("Unknown review tag: " + tag);
            }
            unique.add(code);
        }
        return String.join(",", unique);
    }

    private static List<String> decodeTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return List.of();
        }
        return List.of(tags.split(","));
    }

    private static ReviewDto dto(Review review) {
        User reviewer = review.getReviewer();
        return new ReviewDto(
                String.valueOf(review.getId()),
                review.getSeller().getPublicId(),
                reviewer.getPublicId(),
                review.getListing().getId(),
                review.getListing().getTitle(),
                reviewer.getDisplayName(),
                reviewer.getAvatarUrl(),
                review.getRating(),
                decodeTags(review.getTags()),
                review.getComment() == null ? "" : review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt());
    }

    /** Same rules as computeSellerStats() in the frontend, so both modes show identical badges. */
    private static SellerStatsDto stats(List<Review> sellerReviews) {
        int count = sellerReviews.size();
        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int rating = 1; rating <= 5; rating++) {
            distribution.put(rating, 0L);
        }
        Map<String, Long> tagCounts = new LinkedHashMap<>();
        long sum = 0;
        for (Review review : sellerReviews) {
            sum += review.getRating();
            distribution.merge(review.getRating(), 1L, Long::sum);
            for (String tag : decodeTags(review.getTags())) {
                tagCounts.merge(tag, 1L, Long::sum);
            }
        }
        double average = count == 0 ? 0 : Math.round((sum / (double) count) * 10) / 10.0;

        List<String> topTags = new ArrayList<>(tagCounts.keySet());
        topTags.sort(Comparator.comparingLong((String tag) -> tagCounts.get(tag)).reversed());
        if (topTags.size() > 5) {
            topTags = topTags.subList(0, 5);
        }

        List<String> badges = new ArrayList<>();
        if (count < 3) {
            badges.add("new_seller");
        } else {
            if (average >= 4.5) {
                badges.add("trusted_seller");
            }
            if (tagCounts.getOrDefault("fast_reply", 0L) >= 3) {
                badges.add("fast_responder");
            }
            if (tagCounts.getOrDefault("as_described", 0L) >= 3) {
                badges.add("honest_listings");
            }
        }
        return new SellerStatsDto(count, average, distribution, topTags, badges);
    }
}
