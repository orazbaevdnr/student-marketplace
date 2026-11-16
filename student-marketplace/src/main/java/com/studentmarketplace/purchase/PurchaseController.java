package com.studentmarketplace.purchase;

import com.studentmarketplace.common.PageResponse;
import com.studentmarketplace.security.AppUserPrincipal;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Purchases")
@SecurityRequirement(name = "bearerAuth")
public class PurchaseController {

    private final PurchaseService purchases;

    public PurchaseController(PurchaseService purchases) {
        this.purchases = purchases;
    }

    /** A buyer buys an AVAILABLE listing. 409 if it was just sold to someone else. */
    @PostMapping("/listings/{listingId}/purchase")
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseResponse buy(@AuthenticationPrincipal AppUserPrincipal me, @PathVariable String listingId) {
        return purchases.buy(me, listingId);
    }

    @GetMapping("/purchases/mine")
    public PageResponse<PurchaseResponse> myPurchases(@AuthenticationPrincipal AppUserPrincipal me, Pageable pageable) {
        return purchases.myPurchases(me, pageable);
    }

    @GetMapping("/purchases/sales")
    public PageResponse<PurchaseResponse> mySales(@AuthenticationPrincipal AppUserPrincipal me, Pageable pageable) {
        return purchases.mySales(me, pageable);
    }
}
