package com.studentmarketplace.review;

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

/** Table REVIEWS: one student's rating and feedback about another student's listing. */
@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(name = "rating", nullable = false)
    private int rating;

    /** Comma-separated tag codes (as_described, fast_reply, ...); empty when no tag was chosen. */
    @Column(name = "tags", nullable = false, length = 255)
    private String tags;

    @Column(name = "comment", length = 2000)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Review() {
    }

    public Review(User seller, User reviewer, Listing listing, int rating, String tags,
                  String comment, Instant now) {
        this.seller = seller;
        this.reviewer = reviewer;
        this.listing = listing;
        this.rating = rating;
        this.tags = tags;
        this.comment = comment;
        this.createdAt = now;
        this.updatedAt = now;
    }

    /** null means "leave unchanged". */
    public void update(Integer rating, String tags, String comment, Instant now) {
        if (rating != null) {
            this.rating = rating;
        }
        if (tags != null) {
            this.tags = tags;
        }
        if (comment != null) {
            this.comment = comment;
        }
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public User getSeller() {
        return seller;
    }

    public User getReviewer() {
        return reviewer;
    }

    public Listing getListing() {
        return listing;
    }

    public int getRating() {
        return rating;
    }

    public String getTags() {
        return tags;
    }

    public String getComment() {
        return comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
