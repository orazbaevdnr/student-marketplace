# Defect record — SEC-01

**Severity:** High  
**Status:** Source fix applied; runtime retest pending  
**File:** `student-marketplace/src/main/resources/application.yml`

## Evidence in supplied source archive
The original configuration contained these fallbacks:
- `DB_PASSWORD:admin`
- `JWT_SECRET:dev-local-secret-change-in-production-!!`
- `ADMIN_PASSWORD:Admin12345!`

If deployment variables were omitted, the app could use known credentials or a predictable JWT signing key. A predictable signing key threatens token integrity; a known administrator password risks unauthorized administrator access.

## Fix applied in the working copy
- Database password changed to `${DB_PASSWORD}` (no insecure fallback).
- JWT secret changed to `${JWT_SECRET}` (no predictable fallback). `JwtService` already requires at least 32 bytes.
- Administrator password changed to `${ADMIN_PASSWORD:}`. `AdminBootstrap` skips account creation when the password is blank.

## Required retest
Start the backend without `DB_PASSWORD` and `JWT_SECRET` and confirm startup/configuration fails rather than using defaults. Then provide unique environment values and confirm normal startup. Confirm no admin is created when `ADMIN_PASSWORD` is blank and that an admin is created only when an explicit strong password is provided.

**Limit:** This is a source-level fix only. The app was not launched here; runtime retest is outstanding.
