package com.studentmarketplace.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class CategoryDtos {

    private CategoryDtos() {
    }

    public record Request(@NotBlank @Size(max = 60) String name, @Size(max = 255) String description) {
    }

    public record ActiveRequest(@NotNull Boolean active) {
    }

    public record Response(Long id, String name, String slug, String description, boolean active) {
        public static Response from(Category c) {
            return new Response(c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.isActive());
        }
    }
}
