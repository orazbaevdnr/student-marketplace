package com.studentmarketplace.stale;

import com.studentmarketplace.config.AppProperties;
import com.studentmarketplace.listing.Listing;
import com.studentmarketplace.listing.ListingRepository;
import com.studentmarketplace.listing.ListingStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

/**
 * The decision from the Task 9 plan: an AVAILABLE listing that the seller has not confirmed for 30 days gets a reminder,
 * and after 37 days it is hidden, so buyers do not see items that are no longer for sale.
 */
@Service
public class StaleListingService {

    private final ListingRepository listings;
    private final ReminderNotifier notifier;
    private final AppProperties props;
    private final Clock clock;

    public StaleListingService(ListingRepository listings, ReminderNotifier notifier, AppProperties props, Clock clock) {
        this.listings = listings;
        this.notifier = notifier;
        this.props = props;
        this.clock = clock;
    }

    @Transactional
    public StaleJobResult runOnce() {
        LocalDate today = LocalDate.now(clock);
        int hideAfter = props.stale().hideAfterDays();
        int remindAfter = props.stale().remindAfterDays();

        int hidden = listings.hideStale(ListingStatus.AVAILABLE, ListingStatus.HIDDEN, today.minusDays(hideAfter));

        List<Listing> toRemind = listings.findToRemind(ListingStatus.AVAILABLE, today.minusDays(remindAfter));
        for (Listing listing : toRemind) {
            notifier.remind(listing, listing.getLastUpdated().plusDays(hideAfter));
            listing.markReminded(today);
        }
        return new StaleJobResult(hidden, toRemind.size());
    }
}
