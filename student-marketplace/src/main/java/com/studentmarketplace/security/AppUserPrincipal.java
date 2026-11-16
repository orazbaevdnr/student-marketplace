package com.studentmarketplace.security;

import com.studentmarketplace.user.Role;

/** The logged-in user, rebuilt from the JWT on every request (no database call). */
public record AppUserPrincipal(Long id, String email, Role role) {

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
