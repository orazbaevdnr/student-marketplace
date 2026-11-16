package com.studentmarketplace.favorite;

import com.studentmarketplace.listing.Listing;
import com.studentmarketplace.listing.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Optional<Favorite> findByUserIdAndListingId(Long userId, String listingId);

    boolean existsByUserIdAndListingId(Long userId, String listingId);

    /** The saved listings of a user, newest favorite first, with seller and category in the same query. */
    @Query("select l from Favorite f join f.listing l join fetch l.seller join fetch l.category "
            + "where f.user.id = :userId and l.status <> :hidden order by f.createdAt desc, f.id desc")
    List<Listing> findListingsOfUser(@Param("userId") Long userId, @Param("hidden") ListingStatus hidden);
}
