package com.studentmarketplace.client;

import com.studentmarketplace.client.ClientDtos.FavoriteState;
import com.studentmarketplace.client.ClientDtos.ListingDto;
import com.studentmarketplace.common.Exceptions.NotFoundException;
import com.studentmarketplace.favorite.Favorite;
import com.studentmarketplace.favorite.FavoriteRepository;
import com.studentmarketplace.listing.Listing;
import com.studentmarketplace.listing.ListingRepository;
import com.studentmarketplace.listing.ListingStatus;
import com.studentmarketplace.security.AppUserPrincipal;
import com.studentmarketplace.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Optional;

/** Favorites are private: a user reads and changes only his or her own. */
@Service
public class ClientFavoriteService {

    private final FavoriteRepository favorites;
    private final ListingRepository listings;
    private final ClientUserService users;
    private final ClientListingService listingService;
    private final Clock clock;

    public ClientFavoriteService(FavoriteRepository favorites, ListingRepository listings, ClientUserService users,
                                 ClientListingService listingService, Clock clock) {
        this.favorites = favorites;
        this.listings = listings;
        this.users = users;
        this.listingService = listingService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public java.util.List<ListingDto> list(AppUserPrincipal me, String userId, String baseUrl) {
        User user = users.requireSelf(me, userId);
        return listingService.assemble(favorites.findListingsOfUser(user.getId(), ListingStatus.HIDDEN), true, baseUrl);
    }

    @Transactional(readOnly = true)
    public FavoriteState isFavorite(AppUserPrincipal me, String userId, String listingId) {
        User user = users.requireSelf(me, userId);
        return new FavoriteState(favorites.existsByUserIdAndListingId(user.getId(), listingId));
    }

    /** Saved -> removed, not saved -> saved. Returns the new state. */
    @Transactional
    public FavoriteState toggle(AppUserPrincipal me, String userId, String listingId) {
        User user = users.requireSelf(me, userId);
        Optional<Favorite> existing = favorites.findByUserIdAndListingId(user.getId(), listingId);
        if (existing.isPresent()) {
            favorites.delete(existing.get());
            return new FavoriteState(false);
        }
        Listing listing = listings.findById(listingId)
                .orElseThrow(() -> new NotFoundException("Listing " + listingId + " not found"));
        boolean ownHidden = listing.getStatus() == ListingStatus.HIDDEN
                && listing.getSeller().getId().equals(user.getId());
        if (listing.getStatus() == ListingStatus.HIDDEN && !ownHidden) {
            throw new NotFoundException("Listing " + listingId + " not found");
        }
        favorites.save(new Favorite(user, listing, clock.instant()));
        return new FavoriteState(true);
    }
}
