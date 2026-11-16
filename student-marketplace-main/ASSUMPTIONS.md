# Engineering Assumptions & Design Decisions

This document logs the defaults and decisions behind the implementation. Every item below matches the code that is actually in the repository.

---

### 1. Authentication

- **JWT only.** There is no Firebase, no OAuth provider and no client-side mock authentication. The Spring Boot backend issues a signed JWT from `POST /api/client/auth/register` and `POST /api/client/auth/login`; the frontend stores it in `localStorage` (`sm_access_token`) and sends it as `Authorization: Bearer <token>`.
- **Session restore.** On page load the app calls `GET /api/client/auth/me`. A `401` anywhere clears the token and returns the user to `/login` (see `src/auth/session.ts` and `src/auth/AuthContext.tsx`).
- **Route protection.** `src/auth/ProtectedRoute.tsx` guards every page except `/login` and remembers the requested path, so the user returns there after signing in.
- **Password rules.** Minimum 8 characters, validated on both sides; the backend stores BCrypt hashes only.
- **Email domain restriction.** The backend can require a university domain via `ALLOWED_EMAIL_DOMAIN` (default `kbtu.kz` in the dev profile and tests, empty = any domain). This is server-side policy, not a frontend assumption.
- **No e-mail verification flow.** `email_verified` is set to `true` on registration and is exposed as `emailVerified` for future use; there is no verification screen or banner.

### 2. Data Persistence

- **PostgreSQL is the only database.** The schema is owned by Flyway (`src/main/resources/db/migration`, V1–V4) and Hibernate runs with `ddl-auto: none`, so entities never change the schema. The `dev` and `test` profiles use in-memory H2 in PostgreSQL compatibility mode; production uses PostgreSQL.
- **Listings** live in `listings` with photos in `listing_photos` (files on disk under `PHOTO_DIR`, paths in the database).
- **Favorites** are rows in `favorites`, unique per `(user_id, listing_id)`.
- **Photos** are uploaded as base64 data URLs (max 5 per listing, 5 MB each, PNG/JPEG/WebP). The frontend scales images down to 1024 px on a canvas before sending; the backend validates the header, stores the bytes and returns absolute URLs.
- **No client-side persistence of business data.** `localStorage` holds the JWT and nothing else.
- **User ids** are numeric primary keys exposed as strings. The contract accepts `me` as an alias for the current user in `/users/{userId}` paths.

### 3. Listing rules enforced by the backend

- Only the seller can edit or delete a listing; a sold or reserved listing cannot be edited.
- The catalog shows `active` listings only. `reserved` (bought through the main API) and `hidden` (37 days without seller confirmation) are returned to the owner and shown in the **Reserved & hidden** tab of *My listings*.
- `PATCH /listings/{id}/status` accepts only `sold` and `active`; marking a listing active again also confirms it for the stale-listing job.
- Prices are whole KZT greater than zero; the database has `CHECK` constraints in addition to bean validation.

### 4. UI/UX & Responsive Layout

- **Design system:** Indigo primary accent, Emerald for success/verified states, Rose for favorites, slate neutrals.
- **Mobile-first (360px+):** desktop top navigation with debounced search and a user dropdown; below 768 px a fixed bottom navigation bar (`BottomNav`) with Home, Favorites, Post Listing, My Listings and Profile.
- **URL state:** catalog search (`q`), category, condition, min/max price and sort order are synchronized with URL query parameters, so refresh and back/forward preserve the filters.
- **Optimistic favorites:** the heart icon updates immediately and rolls back if the API call fails.
- **Dates:** `createdAt` is a calendar date (`YYYY-MM-DD`) and is rendered as a date, not as a relative "x hours ago" value.
- **Empty/edge states:** every list has a skeleton while loading, an empty state, and an error state with retry.

### 5. Development workflow

- Run the backend from IntelliJ (or `mvn spring-boot:run -Dspring-boot.run.profiles=dev`) on port 8080, then `npm run dev` on port 5173. Vite proxies `/api` to the backend, so the frontend needs no CORS configuration in development (the backend allow-list still includes `http://localhost:5173`).
- `mvn verify` runs the 19 backend tests (unit, integration, and the full `/api/client` contract) on H2 with all Flyway migrations applied.
- `npm run build` type-checks the whole frontend with `tsc` and produces the production bundle.

### 6. Internationalization (i18n)

- All user-facing strings are centralized in `src/i18n/strings.ts`, allowing a future multi-language dictionary (Russian / Kazakh / English).
