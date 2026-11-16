package com.studentmarketplace.listing;

import com.studentmarketplace.common.Exceptions.BadRequestException;

import java.util.Locale;

/** Condition of the item. The frontend writes it in lower case: new, like_new, good, fair. */
public enum ListingCondition {
    NEW,
    LIKE_NEW,
    GOOD,
    FAIR;

    public String api() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static ListingCondition fromApi(String value) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("condition is required (new, like_new, good or fair)");
        }
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown condition '" + value + "'. Allowed: new, like_new, good, fair");
        }
    }
}
