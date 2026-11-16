package com.studentmarketplace.user;

import java.time.Instant;

public record UserResponse(Long id, String email, String displayName, Role role, boolean active, Instant createdAt) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUniversityEmail(), u.getDisplayName(), u.getRole(),
                u.isActive(), u.getCreatedAt());
    }
}
