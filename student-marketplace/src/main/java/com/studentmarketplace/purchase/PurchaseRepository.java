package com.studentmarketplace.purchase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    boolean existsByListingId(String listingId);

    @Query(value = "select p from Purchase p join fetch p.listing l join fetch l.seller join fetch p.buyer "
            + "where p.buyer.id = :buyerId",
            countQuery = "select count(p) from Purchase p where p.buyer.id = :buyerId")
    Page<Purchase> findByBuyer(@Param("buyerId") Long buyerId, Pageable pageable);

    @Query(value = "select p from Purchase p join fetch p.listing l join fetch l.seller join fetch p.buyer "
            + "where l.seller.id = :sellerId",
            countQuery = "select count(p) from Purchase p where p.listing.seller.id = :sellerId")
    Page<Purchase> findBySeller(@Param("sellerId") Long sellerId, Pageable pageable);

    @Query(value = "select p from Purchase p join fetch p.listing l join fetch l.seller join fetch p.buyer",
            countQuery = "select count(p) from Purchase p")
    Page<Purchase> findAllWithDetails(Pageable pageable);
}
