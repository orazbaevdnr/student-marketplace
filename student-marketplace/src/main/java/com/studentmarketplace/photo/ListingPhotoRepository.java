package com.studentmarketplace.photo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ListingPhotoRepository extends JpaRepository<ListingPhoto, Long> {

    List<ListingPhoto> findByListingIdOrderBySortOrderAsc(String listingId);

    /** Photos of many listings with one query (used for a page of results). */
    List<ListingPhoto> findByListingIdInOrderBySortOrderAsc(Collection<String> listingIds);

    Optional<ListingPhoto> findByIdAndListingId(Long id, String listingId);

    long countByListingId(String listingId);

    @Query("select coalesce(max(p.sortOrder), 0) from ListingPhoto p where p.listing.id = :listingId")
    int maxSortOrder(@Param("listingId") String listingId);

    /** The first photo of each of the given listings. */
    @Query("select new com.studentmarketplace.photo.MainPhotoRef(p.listing.id, p.id) from ListingPhoto p "
            + "where p.listing.id in :ids and p.sortOrder = "
            + "(select min(p2.sortOrder) from ListingPhoto p2 where p2.listing.id = p.listing.id)")
    List<MainPhotoRef> findMainPhotos(@Param("ids") Collection<String> ids);

    @Modifying
    @Query("delete from ListingPhoto p where p.listing.id = :listingId")
    void deleteByListingId(@Param("listingId") String listingId);
}
