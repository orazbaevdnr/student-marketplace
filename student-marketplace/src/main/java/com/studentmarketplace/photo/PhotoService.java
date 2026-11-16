package com.studentmarketplace.photo;

import com.studentmarketplace.common.Exceptions.BadRequestException;
import com.studentmarketplace.common.Exceptions.ConflictException;
import com.studentmarketplace.common.Exceptions.ForbiddenException;
import com.studentmarketplace.common.Exceptions.NotFoundException;
import com.studentmarketplace.config.AppProperties;
import com.studentmarketplace.listing.Listing;
import com.studentmarketplace.listing.ListingRepository;
import com.studentmarketplace.listing.ListingStatus;
import com.studentmarketplace.security.AppUserPrincipal;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.time.LocalDate;

@Service
public class PhotoService {

    public record PhotoContent(Resource resource, MediaType mediaType) {
    }

    private final ListingRepository listings;
    private final ListingPhotoRepository photos;
    private final PhotoStorage storage;
    private final AppProperties props;
    private final Clock clock;

    public PhotoService(ListingRepository listings, ListingPhotoRepository photos, PhotoStorage storage,
                        AppProperties props, Clock clock) {
        this.listings = listings;
        this.photos = photos;
        this.storage = storage;
        this.props = props;
        this.clock = clock;
    }

    @Transactional
    public PhotoResponse add(AppUserPrincipal me, String listingId, MultipartFile file) {
        Listing listing = ownedListing(me, listingId);
        if (file.isEmpty()) {
            throw new BadRequestException("The file is empty");
        }
        int max = props.storage().maxPhotosPerListing();
        if (photos.countByListingId(listingId) >= max) {
            throw new ConflictException("A listing can have at most " + max + " photos");
        }
        String path = storage.store(listingId, file);
        try {
            ListingPhoto photo = photos.save(new ListingPhoto(listing, path,
                    photos.maxSortOrder(listingId) + 1, clock.instant()));
            listing.confirm(LocalDate.now(clock));   // adding a photo is also a seller update
            return PhotoResponse.from(photo, listingId);
        } catch (RuntimeException e) {
            storage.deleteQuietly(path);
            throw e;
        }
    }

    @Transactional
    public void delete(AppUserPrincipal me, String listingId, Long photoId) {
        ownedListing(me, listingId);
        ListingPhoto photo = photos.findByIdAndListingId(photoId, listingId)
                .orElseThrow(() -> new NotFoundException("Photo " + photoId + " not found"));
        photos.delete(photo);
        storage.deleteAfterCommit(java.util.List.of(photo.getFilePath()));
    }

    /** {@code me} may be null: photo files are public, except those of hidden listings. */
    @Transactional(readOnly = true)
    public PhotoContent content(AppUserPrincipal me, String listingId, Long photoId) {
        Listing listing = listings.findById(listingId)
                .orElseThrow(() -> new NotFoundException("Listing " + listingId + " not found"));
        boolean manager = me != null && (me.isAdmin() || listing.getSeller().getId().equals(me.id()));
        if (listing.getStatus() == ListingStatus.HIDDEN && !manager) {
            throw new NotFoundException("Photo " + photoId + " not found");
        }
        ListingPhoto photo = photos.findByIdAndListingId(photoId, listingId)
                .orElseThrow(() -> new NotFoundException("Photo " + photoId + " not found"));
        return new PhotoContent(storage.load(photo.getFilePath()), PhotoStorage.mediaType(photo.getFilePath()));
    }

    private Listing ownedListing(AppUserPrincipal me, String listingId) {
        Listing listing = listings.findById(listingId)
                .orElseThrow(() -> new NotFoundException("Listing " + listingId + " not found"));
        if (!listing.getSeller().getId().equals(me.id())) {
            throw new ForbiddenException("Only the seller can change the photos of this listing");
        }
        if (listing.getStatus() == ListingStatus.SOLD) {
            throw new ConflictException("A sold listing cannot be changed");
        }
        return listing;
    }
}
