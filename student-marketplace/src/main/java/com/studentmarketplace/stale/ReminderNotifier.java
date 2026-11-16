package com.studentmarketplace.stale;

import com.studentmarketplace.listing.Listing;

import java.time.LocalDate;

/**
 * "Remind sellers" from the Task 9 decision. The default implementation only writes to the log;
 * to send real e-mails, add another implementation (and remove @Component from the logging one).
 */
public interface ReminderNotifier {

    void remind(Listing listing, LocalDate hiddenOn);
}
