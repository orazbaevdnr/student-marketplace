package com.studentmarketplace.listing;

import com.studentmarketplace.category.Category;
import com.studentmarketplace.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.LocalDate;

/** Table LISTINGS: the core table. The ID (L-101, L-102, ...) is assigned by the system, never by the user. */
@Entity
@Table(name = "listings")
public class Listing {

    @Id
    @Column(name = "listing_id", length = 16)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "price_kzt", nullable = false)
    private int priceKzt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ListingStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDate createdAt;

    @Column(name = "last_updated", nullable = false)
    private LocalDate lastUpdated;

    @Column(name = "reminder_sent_on")
    private LocalDate reminderSentOn;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_condition", nullable = false, length = 20)
    private ListingCondition condition = ListingCondition.GOOD;

    /** How a buyer reaches the seller (for example a Telegram name). Shown only to logged-in users. */
    @Column(name = "contact", length = 100)
    private String contact;

    /** Optimistic lock: two simultaneous edits cannot silently overwrite each other. */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    protected Listing() {
    }

    public Listing(String id, User seller, Category category, String title, String description,
                   int priceKzt, LocalDate today) {
        this.id = id;
        this.seller = seller;
        this.category = category;
        this.title = title;
        this.description = description;
        this.priceKzt = priceKzt;
        this.status = ListingStatus.AVAILABLE;
        this.createdAt = today;
        this.lastUpdated = today;
    }

    /** A seller edit also confirms that the item is still for sale. */
    public void update(String title, String description, int priceKzt, Category category, LocalDate today) {
        this.title = title;
        this.description = description;
        this.priceKzt = priceKzt;
        this.category = category;
        confirm(today);
    }

    /** The seller says "still for sale": resets the 30-day clock and brings a hidden listing back. */
    public void confirm(LocalDate today) {
        this.lastUpdated = today;
        this.reminderSentOn = null;
        if (status == ListingStatus.HIDDEN) {
            status = ListingStatus.AVAILABLE;
        }
    }

    public void markReminded(LocalDate today) {
        this.reminderSentOn = today;
    }

    public void updateExtras(ListingCondition condition, String contact) {
        this.condition = condition;
        this.contact = contact;
    }

    public ListingCondition getCondition() {
        return condition;
    }

    public String getContact() {
        return contact;
    }

    public String getId() {
        return id;
    }

    public User getSeller() {
        return seller;
    }

    public Category getCategory() {
        return category;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public int getPriceKzt() {
        return priceKzt;
    }

    public ListingStatus getStatus() {
        return status;
    }

    public void setStatus(ListingStatus status) {
        this.status = status;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public LocalDate getLastUpdated() {
        return lastUpdated;
    }

    public LocalDate getReminderSentOn() {
        return reminderSentOn;
    }
}
