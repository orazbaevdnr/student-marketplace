package com.studentmarketplace.listing;

import com.studentmarketplace.admin.StaleListingRow;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ListingRepository extends JpaRepository<Listing, String>, JpaSpecificationExecutor<Listing> {

    /** Search page: seller and category come in the same query, so a page of 20 listings costs 2 queries, not 41. */
    @Override
    @EntityGraph(attributePaths = {"seller", "category"})
    Page<Listing> findAll(Specification<Listing> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"seller", "category"})
    Optional<Listing> findWithRelationsById(String id);

    /** Row lock for the purchase transaction: the second buyer waits and then sees status SOLD. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from Listing l where l.id = :id")
    Optional<Listing> findByIdForUpdate(@Param("id") String id);

    /** Next number for a listing ID (L-101, L-102, ...). */
    @Query(value = "select nextval('listing_id_seq')", nativeQuery = true)
    long nextNumber();

    @Query("select new com.studentmarketplace.admin.StaleListingRow(l.id, u.displayName, l.priceKzt, l.lastUpdated) "
            + "from Listing l join l.seller u "
            + "where l.status = :status and l.lastUpdated < :cutoff order by l.lastUpdated asc")
    List<StaleListingRow> findStale(@Param("status") ListingStatus status, @Param("cutoff") LocalDate cutoff);

    /** One UPDATE for all stale listings, instead of loading and saving them one by one. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Listing l set l.status = :hidden, l.version = l.version + 1 "
            + "where l.status = :available and l.lastUpdated < :cutoff")
    int hideStale(@Param("available") ListingStatus available, @Param("hidden") ListingStatus hidden,
                  @Param("cutoff") LocalDate cutoff);

    @EntityGraph(attributePaths = {"seller"})
    @Query("select l from Listing l where l.status = :status and l.lastUpdated < :cutoff and l.reminderSentOn is null")
    List<Listing> findToRemind(@Param("status") ListingStatus status, @Param("cutoff") LocalDate cutoff);

    @Query("select l.status, count(l) from Listing l group by l.status")
    List<Object[]> countByStatus();
}
