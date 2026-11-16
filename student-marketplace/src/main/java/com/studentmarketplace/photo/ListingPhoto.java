package com.studentmarketplace.photo;

import com.studentmarketplace.listing.Listing;
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

/** Table LISTING_PHOTOS: the image itself lives on disk, the database keeps only its path. */
@Entity
@Table(name = "listing_photos")
public class ListingPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "photo_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(name = "file_path", nullable = false, length = 255)
    private String filePath;

    /** 1 = main photo. */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    protected ListingPhoto() {
    }

    public ListingPhoto(Listing listing, String filePath, int sortOrder, Instant uploadedAt) {
        this.listing = listing;
        this.filePath = filePath;
        this.sortOrder = sortOrder;
        this.uploadedAt = uploadedAt;
    }

    public Long getId() {
        return id;
    }

    public Listing getListing() {
        return listing;
    }

    public String getFilePath() {
        return filePath;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }
}
