package com.studentmarketplace.client;

import com.studentmarketplace.category.Category;
import com.studentmarketplace.category.CategoryRepository;
import com.studentmarketplace.client.ClientDtos.ListingDto;
import com.studentmarketplace.client.ClientDtos.ListingPage;
import com.studentmarketplace.client.ClientDtos.ListingRequest;
import com.studentmarketplace.common.Exceptions.BadRequestException;
import com.studentmarketplace.common.Exceptions.ConflictException;
import com.studentmarketplace.common.Exceptions.ForbiddenException;
import com.studentmarketplace.common.Exceptions.NotFoundException;
import com.studentmarketplace.config.AppProperties;
import com.studentmarketplace.listing.Listing;
import com.studentmarketplace.listing.ListingCondition;
import com.studentmarketplace.listing.ListingRepository;
import com.studentmarketplace.listing.ListingService;
import com.studentmarketplace.listing.ListingSpecifications;
import com.studentmarketplace.listing.ListingStatus;
import com.studentmarketplace.photo.ListingPhoto;
import com.studentmarketplace.photo.ListingPhotoRepository;
import com.studentmarketplace.photo.PhotoStorage;
import com.studentmarketplace.security.AppUserPrincipal;
import com.studentmarketplace.user.User;
import com.studentmarketplace.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * The listing part of the frontend contract (API_CONTRACT.md).
 * It sits on top of the same tables and rules as the main API: the seller is always the logged-in user,
 * only AVAILABLE listings are in the catalog, a sold listing cannot be changed.
 */
@Service
public class ClientListingService {

    private static final int MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    /** Recognises the URLs this API returns for pictures: .../photos/{id}/content */
    private static final Pattern PHOTO_URL = Pattern.compile("/photos/(\\d+)/content/?(?:[?#].*)?$");

    private final ListingRepository listings;
    private final ListingPhotoRepository photos;
    private final CategoryRepository categories;
    private final UserRepository users;
    private final ListingService listingService;
    private final PhotoStorage storage;
    private final AppProperties props;
    private final Clock clock;

    public ClientListingService(ListingRepository listings, ListingPhotoRepository photos,
                                CategoryRepository categories, UserRepository users, ListingService listingService,
                                PhotoStorage storage, AppProperties props, Clock clock) {
        this.listings = listings;
        this.photos = photos;
        this.categories = categories;
        this.users = users;
        this.listingService = listingService;
        this.storage = storage;
        this.props = props;
        this.clock = clock;
    }

    // ---------- reading ----------

    @Transactional(readOnly = true)
    public ListingPage search(AppUserPrincipal me, String q, String category, String condition, Integer minPrice,
                              Integer maxPrice, String sort, Integer page, Integer pageSize, String baseUrl) {
        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            throw new BadRequestException("minPrice must not be greater than maxPrice");
        }
        int pageNumber = page == null || page < 1 ? 1 : page;
        int size = pageSize == null ? 12 : Math.max(1, Math.min(pageSize, 50));
        ListingCondition wanted = condition == null || condition.isBlank() ? null : ListingCondition.fromApi(condition);

        Specification<Listing> spec = ListingSpecifications
                .filter(q, null, minPrice, maxPrice, null, Set.of(ListingStatus.AVAILABLE))
                .and(ListingSpecifications.categorySlug(category))
                .and(ListingSpecifications.condition(wanted));
        Page<Listing> result = listings.findAll(spec, PageRequest.of(pageNumber - 1, size, sortFor(sort)));
        return new ListingPage(assemble(result.getContent(), me != null, baseUrl),
                result.getTotalElements(), pageNumber, size);
    }

    @Transactional(readOnly = true)
    public ListingDto get(AppUserPrincipal me, String id, String baseUrl) {
        Listing listing = find(id);
        if (listing.getStatus() == ListingStatus.HIDDEN && !canManage(me, listing)) {
            throw new NotFoundException("Listing " + id + " not found");
        }
        return assemble(List.of(listing), me != null, baseUrl).get(0);
    }

    // ---------- seller actions ----------

    @Transactional
    public ListingDto create(AppUserPrincipal me, ListingRequest request, String baseUrl) {
        User seller = users.findById(me.id()).filter(User::isActive)
                .orElseThrow(() -> new ForbiddenException("This account is not active"));
        Category category = activeCategory(request.category());
        ListingCondition condition = ListingCondition.fromApi(request.condition());

        Listing listing = new Listing("L-" + listings.nextNumber(), seller, category, request.title().trim(),
                blankToNull(request.description()), request.price(), LocalDate.now(clock));
        listing.updateExtras(condition, blankToNull(request.contact()));
        listings.save(listing);
        syncImages(listing, request.images());
        return assemble(List.of(listing), true, baseUrl).get(0);
    }

    @Transactional
    public ListingDto update(AppUserPrincipal me, String id, ListingRequest request, String baseUrl) {
        Listing listing = ownedAndChangeable(me, id);
        Category category = activeCategory(request.category());
        ListingCondition condition = ListingCondition.fromApi(request.condition());

        listing.update(request.title().trim(), blankToNull(request.description()), request.price(), category,
                LocalDate.now(clock));
        listing.updateExtras(condition, blankToNull(request.contact()));
        syncImages(listing, request.images());
        return assemble(List.of(listing), true, baseUrl).get(0);
    }

    /** {"status":"sold"}: the seller sold the item outside the app. {"status":"active"}: back on sale. */
    @Transactional
    public ListingDto setStatus(AppUserPrincipal me, String id, String status, String baseUrl) {
        Listing listing = ownedAndChangeable(me, id);
        String wanted = status == null ? "" : status.trim().toLowerCase(Locale.ROOT);
        switch (wanted) {
            case "sold" -> listing.setStatus(ListingStatus.SOLD);
            case "active" -> {
                listing.confirm(LocalDate.now(clock));
                listing.setStatus(ListingStatus.AVAILABLE);
            }
            default -> throw new BadRequestException("status must be 'sold' or 'active'");
        }
        return assemble(List.of(listing), true, baseUrl).get(0);
    }

    @Transactional
    public void delete(AppUserPrincipal me, String id) {
        listingService.delete(me, id);
    }

    // ---------- shared with the user and favorites endpoints ----------

    /** Turns listings into the JSON of the contract; the pictures of the whole page come with one query. */
    @Transactional(readOnly = true)
    public List<ListingDto> assemble(List<Listing> content, boolean showContact, String baseUrl) {
        if (content.isEmpty()) {
            return List.of();
        }
        List<String> ids = content.stream().map(Listing::getId).toList();
        Map<String, List<ListingPhoto>> byListing = new HashMap<>();
        for (ListingPhoto photo : photos.findByListingIdInOrderBySortOrderAsc(ids)) {
            byListing.computeIfAbsent(photo.getListing().getId(), k -> new ArrayList<>()).add(photo);
        }
        return content.stream()
                .map(l -> ClientMapper.listing(l, byListing.getOrDefault(l.getId(), List.of()), showContact, baseUrl))
                .toList();
    }

    // ---------- pictures ----------

    /**
     * Makes the pictures of a listing equal to {@code images} (null = leave them alone).
     * Everything is checked and new files are written before anything is deleted, and files of removed
     * pictures are deleted only after the database commit.
     */
    private void syncImages(Listing listing, List<String> images) {
        if (images == null) {
            return;
        }
        int max = props.storage().maxPhotosPerListing();
        if (images.size() > max) {
            throw new BadRequestException("A listing can have at most " + max + " images");
        }
        List<ListingPhoto> existing = photos.findByListingIdOrderBySortOrderAsc(listing.getId());
        Map<Long, ListingPhoto> byId = existing.stream().collect(Collectors.toMap(ListingPhoto::getId, p -> p));

        // 1. understand every entry: a data URL (new picture) or the URL of a picture of this listing (keep)
        List<Object> plan = new ArrayList<>();
        Set<Long> keepIds = new HashSet<>();
        for (String image : images) {
            if (image == null || image.isBlank()) {
                throw new BadRequestException("An image entry is empty");
            }
            if (image.startsWith("data:")) {
                plan.add(image);
                continue;
            }
            Matcher m = PHOTO_URL.matcher(image);
            ListingPhoto kept = m.find() ? byId.get(Long.valueOf(m.group(1))) : null;
            if (kept == null || !keepIds.add(kept.getId())) {
                throw new BadRequestException("Unsupported image. Send a data URL (data:image/png;base64,...) "
                        + "or the URL of an image that belongs to this listing.");
            }
            plan.add(kept);
        }

        List<String> storedNow = new ArrayList<>();
        try {
            // 2. write the new files (a bad image fails here, before any change)
            Map<Integer, String> newFiles = new HashMap<>();
            for (int i = 0; i < plan.size(); i++) {
                if (plan.get(i) instanceof String dataUrl) {
                    String path = storage.storeBytes(listing.getId(), decodeDataUrl(dataUrl));
                    storedNow.add(path);
                    newFiles.put(i, path);
                }
            }
            // 3. remove pictures that are no longer listed
            List<String> removedFiles = new ArrayList<>();
            for (ListingPhoto photo : existing) {
                if (!keepIds.contains(photo.getId())) {
                    photos.delete(photo);
                    removedFiles.add(photo.getFilePath());
                }
            }
            photos.flush();
            // 4. new order, in two steps because (listing_id, sort_order) is UNIQUE
            int temporary = 1000;
            for (Object item : plan) {
                if (item instanceof ListingPhoto kept) {
                    kept.setSortOrder(++temporary);
                }
            }
            photos.flush();
            Instant now = clock.instant();
            for (int i = 0; i < plan.size(); i++) {
                int position = i + 1;
                if (plan.get(i) instanceof ListingPhoto kept) {
                    kept.setSortOrder(position);
                } else {
                    photos.save(new ListingPhoto(listing, newFiles.get(i), position, now));
                }
            }
            photos.flush();
            storage.deleteAfterCommit(removedFiles);
        } catch (RuntimeException e) {
            storedNow.forEach(storage::deleteQuietly);
            throw e;
        }
    }

    private static byte[] decodeDataUrl(String dataUrl) {
        int comma = dataUrl.indexOf(',');
        String header = comma < 0 ? "" : dataUrl.substring(0, comma).toLowerCase(Locale.ROOT);
        if (!(header.equals("data:image/png;base64") || header.equals("data:image/jpeg;base64")
                || header.equals("data:image/jpg;base64") || header.equals("data:image/webp;base64"))) {
            throw new BadRequestException("Images must be data URLs like data:image/png;base64,... (PNG, JPEG or WebP)");
        }
        String base64 = dataUrl.substring(comma + 1);
        if (base64.length() > MAX_IMAGE_BYTES / 3 * 4 + 16) {
            throw new BadRequestException("An image is larger than 5 MB");
        }
        byte[] bytes;
        try {
            bytes = Base64.getMimeDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("An image is not valid base64");
        }
        if (bytes.length > MAX_IMAGE_BYTES) {
            throw new BadRequestException("An image is larger than 5 MB");
        }
        return bytes;
    }

    // ---------- helpers ----------

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

    private Category activeCategory(String slug) {
        Category category = categories.findBySlug(slug.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BadRequestException("Unknown category '" + slug + "'"));
        if (!category.isActive()) {
            throw new BadRequestException("Category '" + slug + "' is not active");
        }
        return category;
    }

    private static boolean canManage(AppUserPrincipal me, Listing listing) {
        return me != null && (me.isAdmin() || listing.getSeller().getId().equals(me.id()));
    }

    private static Sort sortFor(String sort) {
        String wanted = sort == null || sort.isBlank() ? "newest" : sort;
        return switch (wanted) {
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "priceKzt").and(Sort.by(Sort.Direction.ASC, "id"));
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "priceKzt").and(Sort.by(Sort.Direction.ASC, "id"));
            default -> throw new BadRequestException("sort must be newest, price_asc or price_desc");
        };
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
