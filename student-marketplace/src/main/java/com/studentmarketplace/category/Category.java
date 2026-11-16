package com.studentmarketplace.category;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Table CATEGORIES. A category is switched off (is_active = false) instead of deleted, so old listings keep it. */
@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long id;

    @Column(name = "category_name", nullable = false, unique = true, length = 60)
    private String name;

    /** Stable machine name used by the frontend (textbooks, dorm_home, ...). Never changes after creation. */
    @Column(name = "slug", nullable = false, unique = true, length = 40)
    private String slug;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    protected Category() {
    }

    public Category(String name, String slug, String description) {
        this.name = name;
        this.slug = slug;
        this.description = description;
    }

    public String getSlug() {
        return slug;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return active;
    }

    public void update(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
