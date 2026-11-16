package com.studentmarketplace.listing;

import com.studentmarketplace.category.Category;
import com.studentmarketplace.category.CategoryService;
import com.studentmarketplace.common.Exceptions.BadRequestException;
import com.studentmarketplace.common.Exceptions.ConflictException;
import com.studentmarketplace.common.Exceptions.ForbiddenException;
import com.studentmarketplace.common.Exceptions.NotFoundException;
import com.studentmarketplace.common.PageResponse;
import com.studentmarketplace.listing.ListingDtos.Detail;
import com.studentmarketplace.listing.ListingDtos.Request;
import com.studentmarketplace.listing.ListingDtos.Summary;
import com.studentmarketplace.photo.ListingPhoto;
import com.studentmarketplace.photo.ListingPhotoRepository;
import com.studentmarketplace.photo.MainPhotoRef;
import com.studentmarketplace.photo.PhotoResponse;
import com.studentmarketplace.photo.PhotoStorage;
import com.studentmarketplace.purchase.PurchaseRepository;
import com.studentmarketplace.security.AppUserPrincipal;
import com.studentmarketplace.user.User;
import com.studentmarketplace.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The main action of the project: a seller publishes a listing.
 * Access rules: buyers see only AVAILABLE listings, a seller changes only his or her own listings,
 * an administrator can see and delete everything.
 */
@Service
public class ListingService {

    /** Only these fields may be used in ?sort=, so nobody can sort by an unindexed or internal column. */
    private static final Set<String> SORTABLE = Set.of("priceKzt", "lastUpdated", "createdAt", "title");

    private final ListingRepository listings;
    private final ListingPhotoRepository photos;
    private final CategoryService categories;
    private final UserRepository users;
    private final PurchaseRepository purchases;
    private final PhotoStorage storage;
    private final Clock clock;

    public ListingService(ListingRepository listings, ListingPhotoRepository photos, CategoryService categories,
                          UserRepository users, PurchaseRepository purchases, PhotoStorage storage, Clock clock) {
        this.listings = listings;
        this.photos = photos;
        this.categories = categories;
        this.users = users;
        this.purchases = purchases;
        this.storage = storage;
        this.clock = clock;
    }

    // ---------- reading ----------

    @Transactional(readOnly = true)
    public PageResponse<Summary> search(AppUserPrincipal me, String q, Long categoryId, Integer minPrice,
                                        Integer maxPrice, Long sellerId, ListingStatus status, Pageable pageable) {
        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            throw new BadRequestException("minPrice must not be greater than maxPrice");
        }
        // Buyers read only AVAILABLE listings. An administrator may filter by any status.
        Set<ListingStatus> statuses = me.isAdmin()
                ? (status == null ? null : Set.of(status))
                : Set.of(ListingStatus.AVAILABLE);
        return page(listings.findAll(
                ListingSpecifications.filter(q, categoryId, minPrice, maxPrice, sellerId, statuses),
                sanitize(pageable)));
    }

    /** All listings of the logged-in seller, in every status. */
    @Transactional(readOnly = true)
    public PageResponse<Summary> mine(AppUserPrincipal me, ListingStatus status, Pageable pageable) {
        Set<ListingStatus> statuses = status == null ? null : Set.of(status);
        return page(listings.findAll(
                ListingSpecifications.filter(null, null, null, null, me.id(), statuses),
                sanitize(pageable)));
    }

    @Transactional(readOnly = true)
    public Detail get(AppUserPrincipal me, String id) {
        Listing listing = find(id);
        if (listing.getStatus() == ListingStatus.HIDDEN && !canManage(me, listing)) {
            throw new NotFoundException("Listing " + id + " not found");
        }
        return detail(listing);
    }

    // ---------- seller actions ----------

    @Transactional
    public Detail create(AppUserPrincipal me, Request request) {
        User seller = activeUser(me);
        Category category = categories.requireActive(request.categoryId());
        Listing listing = new Listing("L-" + listings.nextNumber(), seller, category,
                request.title().trim(), blankToNull(request.description()), request.priceKzt(),
                LocalDate.now(clock));
        listings.save(listing);
        return ListingMapper.detail(listing, List.of());
    }

    @Transactional
    public Detail update(AppUserPrincipal me, String id, Request request) {
        Listing listing = ownedAndChangeable(me, id);
        Category category = categories.requireActive(request.categoryId());
        listing.update(request.title().trim(), blankToNull(request.description()), request.priceKzt(),
                category, LocalDate.now(clock));
        return detail(listing);
    }

    /** The seller may switch between AVAILABLE and RESERVED. SOLD comes only from a purchase, HIDDEN only from the job. */
    @Transactional
    public Detail changeStatus(AppUserPrincipal me, String id, ListingStatus status) {
        if (status != ListingStatus.AVAILABLE && status != ListingStatus.RESERVED) {
            throw new BadRequestException("The status can only be set to AVAILABLE or RESERVED. "
                    + "SOLD is set by a purchase and HIDDEN by the stale-listing job.");
        }
        Listing listing = ownedAndChangeable(me, id);
        listing.confirm(LocalDate.now(clock));
        listing.setStatus(status);
        return detail(listing);
    }

    /** "Still for sale": restarts the 30-day clock and un-hides the listing. */
    @Transactional
    public Detail confirm(AppUserPrincipal me, String id) {
        Listing listing = ownedAndChangeable(me, id);
        listing.confirm(LocalDate.now(clock));
        return detail(listing);
    }

    @Transactional
    public void delete(AppUserPrincipal me, String id) {
        Listing listing = listings.findById(id)
                .orElseThrow(() -> new NotFoundException("Listing " + id + " not found"));
        if (!canManage(me, listing)) {
            throw new ForbiddenException("Only the seller or an administrator can delete this listing");
        }
        if (purchases.existsByListingId(id)) {
            throw new ConflictException("A listing that has been purchased cannot be deleted");
        }
        List<String> files = photos.findByListingIdOrderBySortOrderAsc(id).stream()
                .map(ListingPhoto::getFilePath).toList();
        photos.deleteByListingId(id);
        listings.delete(listing);
        storage.deleteAfterCommit(files);
    }

    // ---------- helpers ----------

    private PageResponse<Summary> page(Page<Listing> page) {
        List<String> ids = page.getContent().stream().map(Listing::getId).toList();
        Map<String, Long> mainPhotos = ids.isEmpty() ? Map.of()
                : photos.findMainPhotos(ids).stream()
                .collect(Collectors.toMap(MainPhotoRef::listingId, MainPhotoRef::photoId, (a, b) -> a));
        return PageResponse.of(page, page.getContent().stream()
                .map(l -> ListingMapper.summary(l, mainPhotos.get(l.getId())))
                .toList());
    }

    private Detail detail(Listing listing) {
        List<PhotoResponse> photoList = photos.findByListingIdOrderBySortOrderAsc(listing.getId()).stream()
                .map(p -> PhotoResponse.from(p, listing.getId()))
                .toList();
        return ListingMapper.detail(listing, photoList);
    }

    private Listing find(String id) {
        return listings.findWithRelationsById(id)
                .orElseThrow(() -> new NotFoundException("Listing " + id + " not found"));
    }

    private Listing ownedAndChangeable(AppUserPrincipal me, String id) {
        Listing listing = find(id);
        if (!listing.getSeller().getId().equals(me.id())) {
            throw new ForbiddenException("Only the seller can change this listing");
        }
        if (listing.getStatus() == ListingStatus.SOLD) {
            throw new ConflictException("A sold listing cannot be changed");
        }
        return listing;
    }

    private static boolean canManage(AppUserPrincipal me, Listing listing) {
        return me != null && (me.isAdmin() || listing.getSeller().getId().equals(me.id()));
    }

    /** JWTs are not re-checked against the database on every request, so write actions check that the account is still active. */
    private User activeUser(AppUserPrincipal me) {
        User user = users.findById(me.id()).orElseThrow(() -> new ForbiddenException("Account not found"));
        if (!user.isActive()) {
            throw new ForbiddenException("This account is deactivated");
        }
        return user;
    }

    private static Pageable sanitize(Pageable pageable) {
        for (Sort.Order order : pageable.getSort()) {
            if (!SORTABLE.contains(order.getProperty())) {
                throw new BadRequestException("Cannot sort by '" + order.getProperty()
                        + "'. Allowed: " + String.join(", ", SORTABLE.stream().sorted().toList()));
            }
        }
        Sort sort = pageable.getSort().isSorted()
                ? pageable.getSort()
                : Sort.by(Sort.Direction.DESC, "lastUpdated");
        // the ID as the last sort key makes the order stable, so no item repeats or disappears between pages
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort.and(Sort.by("id")));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
