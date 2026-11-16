package com.studentmarketplace.purchase;

import com.studentmarketplace.common.Exceptions.BadRequestException;
import com.studentmarketplace.common.Exceptions.ConflictException;
import com.studentmarketplace.common.Exceptions.ForbiddenException;
import com.studentmarketplace.common.Exceptions.NotFoundException;
import com.studentmarketplace.common.PageResponse;
import com.studentmarketplace.listing.Listing;
import com.studentmarketplace.listing.ListingRepository;
import com.studentmarketplace.listing.ListingStatus;
import com.studentmarketplace.security.AppUserPrincipal;
import com.studentmarketplace.user.User;
import com.studentmarketplace.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;

@Service
public class PurchaseService {

    private final PurchaseRepository purchases;
    private final ListingRepository listings;
    private final UserRepository users;
    private final Clock clock;

    public PurchaseService(PurchaseRepository purchases, ListingRepository listings, UserRepository users, Clock clock) {
        this.purchases = purchases;
        this.listings = listings;
        this.users = users;
        this.clock = clock;
    }

    /**
     * The transaction from the project: insert a row into PURCHASES and set the listing to SOLD.
     * Both steps happen together or not at all (@Transactional rolls everything back on any error).
     * <p>
     * Two buyers clicking "buy" at the same moment are handled twice over:
     * 1) the listing row is locked (SELECT ... FOR UPDATE), so the second buyer waits and then sees SOLD;
     * 2) UNIQUE (listing_id) in PURCHASES is a last safety net inside the database itself.
     */
    @Transactional
    public PurchaseResponse buy(AppUserPrincipal me, String listingId) {
        User buyer = users.findById(me.id())
                .filter(User::isActive)
                .orElseThrow(() -> new ForbiddenException("This account is not active"));
        Listing listing = listings.findByIdForUpdate(listingId)
                .orElseThrow(() -> new NotFoundException("Listing " + listingId + " not found"));
        if (listing.getSeller().getId().equals(buyer.getId())) {
            throw new BadRequestException("You cannot buy your own listing");
        }
        if (listing.getStatus() != ListingStatus.AVAILABLE) {
            throw new ConflictException("Listing " + listingId + " is not available (status "
                    + listing.getStatus() + ")");
        }
        Purchase purchase;
        try {
            purchase = purchases.saveAndFlush(new Purchase(listing, buyer, listing.getPriceKzt(), clock.instant()));
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Listing " + listingId + " has already been sold");
        }
        listing.setStatus(ListingStatus.SOLD);
        return PurchaseResponse.from(purchase);
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseResponse> myPurchases(AppUserPrincipal me, Pageable pageable) {
        return PageResponse.of(purchases.findByBuyer(me.id(), sorted(pageable)).map(PurchaseResponse::from));
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseResponse> mySales(AppUserPrincipal me, Pageable pageable) {
        return PageResponse.of(purchases.findBySeller(me.id(), sorted(pageable)).map(PurchaseResponse::from));
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseResponse> all(Pageable pageable) {
        return PageResponse.of(purchases.findAllWithDetails(sorted(pageable)).map(PurchaseResponse::from));
    }

    /** Newest first; the sort is fixed so clients cannot sort by internal columns. */
    private static Pageable sorted(Pageable p) {
        return PageRequest.of(p.getPageNumber(), p.getPageSize(), Sort.by(Sort.Direction.DESC, "purchasedAt", "id"));
    }
}
