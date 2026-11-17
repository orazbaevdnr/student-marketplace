package com.studentmarketplace.client;

import com.studentmarketplace.client.ClientDtos.ReviewDto;
import com.studentmarketplace.client.ClientDtos.ReviewPage;
import com.studentmarketplace.client.ClientDtos.ReviewPatch;
import com.studentmarketplace.client.ClientDtos.ReviewRequest;
import com.studentmarketplace.client.ClientDtos.SellerProfileDto;
import com.studentmarketplace.client.ClientDtos.Success;
import com.studentmarketplace.security.AppUserPrincipal;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Reviews and seller profiles in the shape of API_CONTRACT.md (src/api/restAdapter.ts). */
@RestController
@RequestMapping("/api/client")
@Tag(name = "Frontend contract: reviews and seller profiles")
@SecurityRequirement(name = "bearerAuth")
public class ClientReviewController {

    private final ClientReviewService reviews;

    public ClientReviewController(ClientReviewService reviews) {
        this.reviews = reviews;
    }

    @GetMapping("/reviews")
    public ReviewPage list(@RequestParam(required = false) String sellerId,
                           @RequestParam(required = false) String reviewerId,
                           @RequestParam(required = false) String listingId,
                           @RequestParam(required = false) Integer page,
                           @RequestParam(required = false) Integer pageSize) {
        return reviews.list(sellerId, reviewerId, listingId, page, pageSize);
    }

    @GetMapping("/reviews/mine")
    public ReviewDto mine(@AuthenticationPrincipal AppUserPrincipal me,
                          @RequestParam(required = false) String reviewerId,
                          @RequestParam String listingId) {
        return reviews.mine(me, reviewerId, listingId);
    }

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto create(@AuthenticationPrincipal AppUserPrincipal me, @Valid @RequestBody ReviewRequest request) {
        return reviews.create(me, request);
    }

    @PatchMapping("/reviews/{id}")
    public ReviewDto update(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String id,
                            @Valid @RequestBody ReviewPatch patch) {
        return reviews.update(me, id, patch);
    }

    @DeleteMapping("/reviews/{id}")
    public Success delete(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String id) {
        reviews.delete(me, id);
        return new Success(true);
    }

    @GetMapping("/sellers/{sellerId}/reviews")
    public List<ReviewDto> sellerReviews(@PathVariable String sellerId) {
        return reviews.sellerReviews(sellerId);
    }

    @GetMapping("/sellers/{sellerId}/profile")
    public SellerProfileDto sellerProfile(@PathVariable String sellerId) {
        return reviews.sellerProfile(sellerId);
    }
}
