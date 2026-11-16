package com.studentmarketplace.stale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs the stale-listing job every night (app.stale.cron, default 03:00).
 * This is written for a single application instance. If you run several instances,
 * add a lock (for example ShedLock) or trigger the admin endpoint from one external scheduler.
 */
@Component
public class StaleListingScheduler {

    private static final Logger log = LoggerFactory.getLogger(StaleListingScheduler.class);

    private final StaleListingService service;

    public StaleListingScheduler(StaleListingService service) {
        this.service = service;
    }

    @Scheduled(cron = "${app.stale.cron:0 0 3 * * *}")
    public void run() {
        StaleJobResult result = service.runOnce();
        log.info("Stale-listing job finished: {} hidden, {} reminded", result.hidden(), result.reminded());
    }
}
