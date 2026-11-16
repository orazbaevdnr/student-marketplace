package com.studentmarketplace.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** Table USERS: sellers, buyers and administrators. */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "university_email", nullable = false, unique = true, length = 255)
    private String universityEmail;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "faculty", length = 100)
    private String faculty;

    @Column(name = "study_year")
    private Integer studyYear;

    @Column(name = "telegram", length = 64)
    private String telegram;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    protected User() {
    }

    public User(String universityEmail, String passwordHash, String displayName, Role role, Instant createdAt) {
        this.universityEmail = universityEmail;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.role = role;
        this.createdAt = createdAt;
        this.emailVerified = true;
    }

    public Long getId() {
        return id;
    }

    public String getUniversityEmail() {
        return universityEmail;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Role getRole() {
        return role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getFaculty() {
        return faculty;
    }

    public Integer getStudyYear() {
        return studyYear;
    }

    public String getTelegram() {
        return telegram;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    /** Stable public identifier used by the React client. */
    public String getPublicId() {
        return String.valueOf(id);
    }

    /** null means "leave unchanged"; an empty text clears faculty and telegram. */
    public void updateProfile(String displayName, String faculty, Integer studyYear, String telegram) {
        if (displayName != null) {
            this.displayName = displayName;
        }
        if (faculty != null) {
            this.faculty = faculty.isBlank() ? null : faculty.trim();
        }
        if (studyYear != null) {
            this.studyYear = studyYear;
        }
        if (telegram != null) {
            this.telegram = telegram.isBlank() ? null : telegram.trim();
        }
    }
}
