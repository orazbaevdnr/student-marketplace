package com.studentmarketplace.client;

import com.studentmarketplace.client.ClientDtos.ListingDto;
import com.studentmarketplace.client.ClientDtos.ListingPage;
import com.studentmarketplace.client.ClientDtos.ListingRequest;
import com.studentmarketplace.client.ClientDtos.StatusRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * Listings in the exact shape of API_CONTRACT.md. Set VITE_API_BASE_URL=http://localhost:8080/api/client
 * GET is public (without a token the seller's contact is hidden); everything else needs a login.
 */
@RestController
@RequestMapping("/api/client/listings")
@Tag(name = "Frontend contract: listings")
@SecurityRequirement(name = "bearerAuth")
public class ClientListingController {

    private final ClientListingService listings;

    public ClientListingController(ClientListingService listings) {
        this.listings = listings;
    }

    @GetMapping
    public ListingPage search(@AuthenticationPrincipal AppUserPrincipal me,
                              @RequestParam(required = false) String q,
                              @RequestParam(required = false) String category,
                              @RequestParam(required = false) String condition,
                              @RequestParam(required = false) Integer minPrice,
                              @RequestParam(required = false) Integer maxPrice,
                              @RequestParam(required = false) String sort,
                              @RequestParam(required = false) Integer page,
                              @RequestParam(required = false) Integer pageSize) {
        return listings.search(me, q, category, condition, minPrice, maxPrice, sort, page, pageSize, baseUrl());
    }

    @GetMapping("/{id}")
    public ListingDto get(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String id) {
        return listings.get(me, id, baseUrl());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ListingDto create(@AuthenticationPrincipal AppUserPrincipal me, @Valid @RequestBody ListingRequest request) {
        return listings.create(me, request, baseUrl());
    }

    @PutMapping("/{id}")
    public ListingDto update(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String id,
                             @Valid @RequestBody ListingRequest request) {
        return listings.update(me, id, request, baseUrl());
    }

    @DeleteMapping("/{id}")
    public Success delete(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String id) {
        listings.delete(me, id);
        return new Success(true);
    }

    @PatchMapping("/{id}/status")
    public ListingDto setStatus(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String id,
                                @Valid @RequestBody StatusRequest request) {
        return listings.setStatus(me, id, request.status(), baseUrl());
    }

    /** http://host:port (or the public address behind a proxy), used to build absolute image URLs. */
    static String baseUrl() {
        return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
    }
}
