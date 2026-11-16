package com.studentmarketplace.listing;

import com.studentmarketplace.common.PageResponse;
import com.studentmarketplace.listing.ListingDtos.Detail;
import com.studentmarketplace.listing.ListingDtos.Request;
import com.studentmarketplace.listing.ListingDtos.StatusRequest;
import com.studentmarketplace.listing.ListingDtos.Summary;
import com.studentmarketplace.security.AppUserPrincipal;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/listings")
@Tag(name = "Listings")
@SecurityRequirement(name = "bearerAuth")
public class ListingController {

    private final ListingService listings;

    public ListingController(ListingService listings) {
        this.listings = listings;
    }

    /** Search: ?q=&categoryId=&minPrice=&maxPrice=&sellerId=&page=0&size=20&sort=priceKzt,asc */
    @GetMapping
    public PageResponse<Summary> search(@AuthenticationPrincipal AppUserPrincipal me,
                                        @RequestParam(required = false) String q,
                                        @RequestParam(required = false) Long categoryId,
                                        @RequestParam(required = false) Integer minPrice,
                                        @RequestParam(required = false) Integer maxPrice,
                                        @RequestParam(required = false) Long sellerId,
                                        @Parameter(description = "Administrators only; everyone else sees AVAILABLE")
                                        @RequestParam(required = false) ListingStatus status,
                                        Pageable pageable) {
        return listings.search(me, q, categoryId, minPrice, maxPrice, sellerId, status, pageable);
    }

    @GetMapping("/mine")
    public PageResponse<Summary> mine(@AuthenticationPrincipal AppUserPrincipal me,
                                      @RequestParam(required = false) ListingStatus status,
                                      Pageable pageable) {
        return listings.mine(me, status, pageable);
    }

    @GetMapping("/{id}")
    public Detail get(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String id) {
        return listings.get(me, id);
    }

    /** The main action: a seller publishes a new listing. Photos are uploaded afterwards. */
    @PostMapping
    public ResponseEntity<Detail> create(@AuthenticationPrincipal AppUserPrincipal me,
                                         @Valid @RequestBody Request request) {
        Detail created = listings.create(me, request);
        return ResponseEntity.created(URI.create("/api/listings/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public Detail update(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String id,
                         @Valid @RequestBody Request request) {
        return listings.update(me, id, request);
    }

    @PatchMapping("/{id}/status")
    public Detail changeStatus(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String id,
                               @Valid @RequestBody StatusRequest request) {
        return listings.changeStatus(me, id, request.status());
    }

    @PostMapping("/{id}/confirm")
    public Detail confirm(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String id) {
        return listings.confirm(me, id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String id) {
        listings.delete(me, id);
    }
}
