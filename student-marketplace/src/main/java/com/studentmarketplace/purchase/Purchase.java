package com.studentmarketplace.purchase;

import com.studentmarketplace.listing.Listing;
import com.studentmarketplace.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/** Table PURCHASES. The database has UNIQUE (listing_id): a listing can be sold only once. */
@Entity
@Table(name = "purchases")
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false, unique = true)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Column(name = "final_price_kzt", nullable = false)
    private int finalPriceKzt;

    @Column(name = "purchased_at", nullable = false)
    private Instant purchasedAt;

    protected Purchase() {
    }

    public Purchase(Listing listing, User buyer, int finalPriceKzt, Instant purchasedAt) {
        this.listing = listing;
        this.buyer = buyer;
        this.finalPriceKzt = finalPriceKzt;
        this.purchasedAt = purchasedAt;
    }

    public Long getId() {
        return id;
    }

    public Listing getListing() {
        return listing;
    }

    public User getBuyer() {
        return buyer;
    }

    public int getFinalPriceKzt() {
        return finalPriceKzt;
    }

    public Instant getPurchasedAt() {
        return purchasedAt;
    }
}
