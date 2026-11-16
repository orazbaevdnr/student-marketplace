package com.studentmarketplace.stale;

import com.studentmarketplace.listing.Listing;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class LoggingReminderNotifier implements ReminderNotifier {

    private static final Logger log = LoggerFactory.getLogger(LoggingReminderNotifier.class);

    @Override
    public void remind(Listing listing, LocalDate hiddenOn) {
        log.info("REMINDER to {}: listing {} ('{}') was last confirmed on {}. Confirm it before {} or it will be hidden.",
                listing.getSeller().getUniversityEmail(), listing.getId(), listing.getTitle(),
                listing.getLastUpdated(), hiddenOn);
    }
}
