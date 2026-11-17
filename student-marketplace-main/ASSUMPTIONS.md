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

### 7. Design system

- **Direction.** "Campus noticeboard": friendly, clear and trustworthy with a little playfulness. Quiet surfaces; the boldness is spent on the price tag on listing cards and on the photo viewer.
- **Tokens.** `--ink #16213A`, `--chalk #F4F6FB`, `--surface #FFFFFF`, `--cobalt #2344D8`, `--sun #F5B700`, `--mint #1FA67A`, `--coral #E5484D` are CSS variables in `src/index.css` and mapped in `tailwind.config.js`. Borders and muted text derive from `--ink` at low opacity.
- **Compatibility remap.** The existing `primary` and `indigo` ramps map to cobalt and `slate` maps to an ink/chalk neutral ramp, so all pages inherit the new look without editing every file. `amber`, `emerald` and `rose` are not remapped blindly: rating caps and badges use `sun`, success and positive tags use `mint`, errors, destructive actions and the favorite heart use `coral`.
- **Typography.** Bricolage Grotesque (headings, logo, prices) and Manrope (body, forms, buttons) are loaded from Google Fonts with `display=swap` and real system fallbacks. Prices use the display font with `font-variant-numeric: tabular-nums`.
- **Card.** Fixed 4:3 photo, a price tag overlapping the bottom-left corner with a notch detail, the duplicate price removed from the text block, two-line title, condition/category badges, and a heart top-right.
- **No seller-rating chip on cards.** `Listing.seller` has no rating and a per-card profile request is forbidden, so the chip is deliberately absent; ratings stay on the details page and seller profile.
- **Local image fallback.** `SafeImage` replaces `picsum.photos` and renders a local icon and label for missing or broken photos; no external placeholder service is contacted.
- **Motion.** Only responses to user actions (hover, press, modal open, favorite toggle, photo change). No scroll-triggered fades. `prefers-reduced-motion` collapses transitions.
- **Focus and theme.** A visible `:focus-visible` ring (cobalt, 2 px offset) is present on interactive elements. The app is light-theme only; a dark theme was the first optional item and was cut.
- **Copy.** Sentence case, buttons name their action ("Post listing", "Save changes", "Delete listing"), no arrows appended to every button. `nav.postListing` is `Post listing` because both call sites already render a `Plus` icon.

### 8. Photo viewer

- **Own portal and focus trap.** `Lightbox` renders through `createPortal` on `document.body` with `role="dialog"` and `aria-modal="true"`. `Modal` has neither a portal nor a focus trap, so the viewer implements both.
- **Opening.** Clicking the main gallery image, pressing `Enter`/`Space` on it, or the Expand button opens the viewer at the current photo. A completed swipe is not treated as a click.
- **Navigation.** Arrow buttons appear only when there is more than one photo; navigation wraps in both directions. `ArrowLeft`/`ArrowRight` do the same from the keyboard, and the thumbnail strip jumps to any photo.
- **Swipe.** Pointer events with a 50 px threshold; pointer capture is feature-detected and guarded, so jsdom and older browsers do not throw.
- **Closing.** The X button, `Escape`, or a click on the backdrop/stage closes the viewer. The previous `body` overflow value is restored, not replaced with a fixed default.
- **Performance.** The two neighbouring photos are preloaded; transitions are disabled while dragging and under reduced motion; the active thumbnail is scrolled into view only when `scrollIntoView` exists.
- **Zoom was cut.** It is allowed by the brief and was the first item on the cut list.
- **Empty and single-photo cases.** A listing with no photos renders a local placeholder and never opens the viewer. A single photo opens the viewer with a `1 / 1` counter and no arrows or thumbnails.

### 9. Testing

- **Tooling.** Vitest 5 with jsdom, React Testing Library 16, user-event 14 and jest-dom, all in `devDependencies`. There is no runtime dependency change. `npm test` runs once; `npm run test:coverage` adds v8 coverage.
- **Exactly 20 tests.** Eight files, one `it` per test, no `it.skip`. The suite covers seller statistics, listing validation, price/date formatting, the search debounce, the mock API (filter, sort, favorites, review rules), route protection, the rating control and the photo viewer.
- **Deviation from the brief's test #2.** The brief expected `averageRating === 0` for two 5-star reviews. The code (and the backend) return `5`; `0` is the value for **zero** reviews only. The test was adapted to assert `0` on an empty array, that the value is never `null`, and that fewer than three reviews yield only `new_seller`. The implementation was not changed.
- **No network.** Tests construct `MockApiClient` directly, never the `api` singleton (which selects `RestApiClient` outside the Pages build), and seed the `localStorage` keys themselves because `SEED_LISTINGS` and `SEED_USERS` are empty. `MockApiClient.delay()` is a real random 200–400 ms timer, so those tests are not wrapped in fake timers.
- **Environment polyfills.** `src/test/setup.ts` clears `localStorage` and the DOM after each test and polyfills `matchMedia` and `PointerEvent`, which jsdom lacks. Implementation code guards `setPointerCapture`, `releasePointerCapture` and `scrollIntoView`.
- **Type checking.** `tsc` includes `src`, so tests are type-checked but never bundled; explicit Vitest imports and `src/test/vitest.d.ts` keep jest-dom matchers available.
- **Scope.** There are no end-to-end tests and the REST adapter is not unit-tested; coverage is reported as-is rather than padded. `TEST_REPORT.md` records the real numbers, the 20 test names and the manual checklist.
