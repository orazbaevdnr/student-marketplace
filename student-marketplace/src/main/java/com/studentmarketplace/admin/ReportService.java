package com.studentmarketplace.admin;

import com.studentmarketplace.common.Exceptions.BadRequestException;
import com.studentmarketplace.config.AppProperties;
import com.studentmarketplace.listing.ListingRepository;
import com.studentmarketplace.listing.ListingStatus;
import com.studentmarketplace.purchase.PurchaseRepository;
import com.studentmarketplace.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** Information for the administrator's decisions (Student 5 part of the Task 9 plan). */
@Service
public class ReportService {

    private final ListingRepository listings;
    private final UserRepository users;
    private final PurchaseRepository purchases;
    private final AppProperties props;
    private final Clock clock;

    public ReportService(ListingRepository listings, UserRepository users, PurchaseRepository purchases,
                         AppProperties props, Clock clock) {
        this.listings = listings;
        this.users = users;
        this.purchases = purchases;
        this.props = props;
        this.clock = clock;
    }

    /**
     * Which AVAILABLE listings have not been updated for more than {@code days} days?
     * (listing, seller, price, last update) ordered from the oldest.
     */
    @Transactional(readOnly = true)
    public List<StaleListingRow> staleListings(Integer days) {
        int d = days == null ? props.stale().remindAfterDays() : days;
        if (d < 1 || d > 3650) {
            throw new BadRequestException("days must be between 1 and 3650");
        }
        return listings.findStale(ListingStatus.AVAILABLE, LocalDate.now(clock).minusDays(d));
    }

    @Transactional(readOnly = true)
    public SummaryResponse summary() {
        Map<ListingStatus, Long> byStatus = new EnumMap<>(ListingStatus.class);
        for (ListingStatus s : ListingStatus.values()) {
            byStatus.put(s, 0L);
        }
        for (Object[] row : listings.countByStatus()) {
            byStatus.put((ListingStatus) row[0], ((Number) row[1]).longValue());
        }
        return new SummaryResponse(byStatus, users.count(), purchases.count());
    }
}
