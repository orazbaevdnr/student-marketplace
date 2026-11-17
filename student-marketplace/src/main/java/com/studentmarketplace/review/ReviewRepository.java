package com.studentmarketplace.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    /**
     * All filters are optional: the reviews hub asks for everything, a seller profile asks
     * for one seller, and "my review for this listing" asks for one reviewer and one listing.
     * The entity graph loads seller, reviewer and listing in the same query.
     */
    @EntityGraph(attributePaths = {"seller", "reviewer", "listing"})
    @Query("select r from Review r "
            + "where (:sellerId is null or r.seller.id = :sellerId) "
            + "and (:reviewerId is null or r.reviewer.id = :reviewerId) "
            + "and (:listingId is null or r.listing.id = :listingId)")
    Page<Review> search(@Param("sellerId") Long sellerId,
                        @Param("reviewerId") Long reviewerId,
                        @Param("listingId") String listingId,
                        Pageable pageable);

    @EntityGraph(attributePaths = {"seller", "reviewer", "listing"})
    List<Review> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    @EntityGraph(attributePaths = {"seller", "reviewer", "listing"})
    Optional<Review> findById(Long id);

    @EntityGraph(attributePaths = {"seller", "reviewer", "listing"})
    Optional<Review> findByReviewerIdAndListingId(Long reviewerId, String listingId);
}
