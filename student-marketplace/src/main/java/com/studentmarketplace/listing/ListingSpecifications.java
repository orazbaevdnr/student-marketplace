package com.studentmarketplace.listing;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;

/** Builds the WHERE clause of the search from whichever filters the buyer filled in. */
public final class ListingSpecifications {

    private ListingSpecifications() {
    }

    public static Specification<Listing> filter(String q, Long categoryId, Integer minPrice, Integer maxPrice,
                                                Long sellerId, Collection<ListingStatus> statuses) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (sellerId != null) {
                predicates.add(cb.equal(root.get("seller").get("id"), sellerId));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<Integer>get("priceKzt"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<Integer>get("priceKzt"), maxPrice));
            }
            if (q != null && !q.isBlank()) {
                String pattern = "%" + escapeLike(q.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.<String>get("title")), pattern, '\\'),
                        cb.like(cb.lower(root.<String>get("description")), pattern, '\\')));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /** Filter by the category slug used by the frontend (textbooks, electronics, ...). */
    public static Specification<Listing> categorySlug(String slug) {
        return (root, query, cb) -> slug == null || slug.isBlank()
                ? cb.conjunction()
                : cb.equal(root.get("category").get("slug"), slug.trim().toLowerCase(Locale.ROOT));
    }

    public static Specification<Listing> condition(ListingCondition condition) {
        return (root, query, cb) -> condition == null
                ? cb.conjunction()
                : cb.equal(root.get("condition"), condition);
    }

    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
