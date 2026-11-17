# Test Report

## 1. Goal and approach

This iteration added a test runner to a frontend that previously had none, and used it to lock down the behaviour that matters for the defense:

- **pure logic** — seller statistics, listing validation, price/date formatting, the search debounce;
- **data access** — the mock API client used by the GitHub Pages build (filtering, sorting, favorites, review rules);
- **UI behaviour** — route protection and the interactive rating control;
- **the new photo viewer** — opening at the requested photo, arrows, wrap-around, Escape, swipe and the single-photo case.

The stack is **Vitest 5** with the **jsdom** environment, **React Testing Library 16**, **user-event 14** and **jest-dom** matchers. All of these are devDependencies; no runtime dependency was added. Tests never touch the network: the mock tests construct `MockApiClient` directly and seed `localStorage` themselves, and `localStorage` is cleared after every test in `src/test/setup.ts`.

The brief asks for exactly 20 tests, one `it` per test and no skipped tests. The suite has **8 files and 20 tests**.

## 2. How to run

```bash
cd student-marketplace-main
npm test              # vitest run — one pass, exits with a status code
npm run test:coverage # vitest run --coverage (v8)
```

`npm run test:watch` runs Vitest in watch mode during development.

## 3. Run results

Real output of `npm test`:

```
 Test Files  8 passed (8)
      Tests  20 passed (20)
   Duration  5.04s (environment 56%, tests 16%, setup 14%, import 13%, transform 1%)
```

Durations vary by a few tenths of a second between runs; the results above are from the final verification run.

`npm run test:coverage` — 20/20 passed, duration 5.40 s. Coverage from v8:

| Scope | % Statements | % Branch | % Functions | % Lines |
|---|---|---|---|---|
| **All files** | **51.71** | **49.85** | **51.58** | **54.62** |
| `src/api/mockAdapter.ts` | 37.73 | 42.42 | 31.25 | 38.72 |
| `src/components/listings/Lightbox.tsx` | 73.10 | 58.82 | 92.85 | 76.86 |
| `src/components/reviews/RatingIcons.tsx` | 67.74 | 51.11 | 85.71 | 70.00 |
| `src/auth/ProtectedRoute.tsx` | 87.50 | 75.00 | 100.00 | 87.50 |
| `src/utils/format.ts` | 70.58 | 61.53 | 66.66 | 78.57 |
| `src/utils/reviews.ts` | 57.44 | 50.00 | 57.14 | 69.44 |
| `src/utils/validation.ts` | 29.68 | 39.02 | 22.22 | 31.14 |

The overall number is intentionally reported as it is: the suite targets behaviour that can break, not line coverage. `validation.ts` is low because only `validateListingDraft` is unit-tested, while the file also contains the browser-only canvas resize helper; `mockAdapter.ts` is low because the tests exercise the read paths, review rules and favorites, not auth or listing CRUD.

## 4. The 20 tests

| # | File | Test name | What it verifies | Result |
|---|---|---|---|---|
| 1 | `src/utils/reviews.test.ts` | `returns the review count and the rounded average rating` | `reviewCount` and one-decimal `averageRating` for five mixed ratings | ✅ |
| 2 | `src/utils/reviews.test.ts` | `returns 0 (not null) with no reviews and awards only the new seller badge below three reviews` | `averageRating === 0` (never `null`) with no reviews; `new_seller` below three reviews | ✅ |
| 3 | `src/utils/reviews.test.ts` | `awards trusted_seller from three reviews at 4.5 or more, but not from two` | The three-review threshold for `trusted_seller` | ✅ |
| 4 | `src/utils/reviews.test.ts` | `counts the distribution and orders at most five top tags by frequency` | Star distribution and frequency-ordered top tags (max 5) | ✅ |
| 5 | `src/utils/validation.test.ts` | `rejects a title shorter than three characters` | Exact title error message from `validateListingDraft` | ✅ |
| 6 | `src/utils/validation.test.ts` | `rejects an empty, negative or non-numeric price` | Price must be a number ≥ 1 | ✅ |
| 7 | `src/utils/validation.test.ts` | `returns no errors for a complete draft` | Valid draft produces `{}` | ✅ |
| 8 | `src/utils/format.test.ts` | `formats prices with grouping and KZT, and renders zero as Free` | KZT formatting with locale spaces; `0` → `Free` | ✅ |
| 9 | `src/utils/format.test.ts` | `formats relative and calendar dates against a fixed clock` | `Just now`, `5m ago`, `3h ago`, `Yesterday`, `3d ago`, `Nov 1` | ✅ |
| 10 | `src/hooks/useDebounce.test.tsx` | `keeps the old value for 299 ms and updates after 300 ms` | Debounce boundary at exactly 300 ms | ✅ |
| 11 | `src/api/mockAdapter.test.ts` | `filters listings by category and inclusive price range` | Category filter and inclusive min/max price | ✅ |
| 12 | `src/api/mockAdapter.test.ts` | `sorts listings by price ascending, price descending and newest` | All three sort orders | ✅ |
| 13 | `src/api/mockAdapter.test.ts` | `toggles a favorite on and off for a user` | Favorite add/remove and the per-user favorites list | ✅ |
| 14 | `src/api/mockAdapter.test.ts` | `rejects a review where the reviewer is the seller` | Self-review guard | ✅ |
| 15 | `src/api/mockAdapter.test.ts` | `rejects a second review by the same reviewer for the same listing` | Duplicate-review guard | ✅ |
| 16 | `src/auth/ProtectedRoute.test.tsx` | `redirects a guest to the login route` | Guest is sent to `/login` and sees no protected content | ✅ |
| 17 | `src/auth/ProtectedRoute.test.tsx` | `renders the protected content for an authenticated user` | Signed-in user sees the guarded page | ✅ |
| 18 | `src/components/reviews/RatingIcons.test.tsx` | `reports a click on four caps and ArrowRight to five` | Click and keyboard change of the interactive rating | ✅ |
| 19 | `src/components/listings/Lightbox.test.tsx` | `opens at the requested photo, moves with the arrows and wraps at both ends` | Start index, counter, next/previous and wrap in both directions | ✅ |
| 20 | `src/components/listings/Lightbox.test.tsx` | `closes on Escape, advances with ArrowRight and a swipe, and hides arrows for one photo` | Escape, keyboard advance, pointer swipe, single-photo controls | ✅ |

## 5. Bugs found and fixed

- **The brief's test #2 contradicted the implementation.** It expected `averageRating` to be `0` for a seller with two 5-star reviews. `computeSellerStats` (and the backend) return `5` there; `0` is only the value for **zero** reviews. The implementation is correct and was not changed. The test now asserts `0` on an empty array, that the value is never `null`, that two reviews still produce a numeric average, and that fewer than three reviews yield only `new_seller`. This deviation is also recorded in `ASSUMPTIONS.md` (section 9).
- **Duplicate `+` in the "Post listing" button.** Manual checking showed `Header` and `MyListings` render a `Plus` icon and then the string `'+ Post listing'`, so the button read `+ + Post listing`. The shared string was changed to `'Post listing'`; both buttons now render one icon and one label.
- **No product defect was exposed by the automated tests.** They passed against the existing logic; the only failure was the expectation above.

## 6. Additional checks

`npm run build` (TypeScript + Vite production build):

```
dist/index.html                 1.13 kB │ gzip:  0.66 kB
dist/assets/index-DO6RZOwN.css 45.39 kB │ gzip:  8.04 kB
dist/assets/index-CLJTytHi.js 326.65 kB │ gzip: 98.48 kB
✓ built in 2.34s
```

`npm run build:pages` (mock bundle, base `/student-marketplace/`):

```
dist/index.html                 1.17 kB │ gzip:  0.67 kB
dist/assets/index-DO6RZOwN.css 45.39 kB │ gzip:  8.04 kB
dist/assets/index-DNAnapSg.js 323.16 kB │ gzip: 97.66 kB
✓ built in 2.30s
```

Manual checklist, run against the mock bundle served with `vite preview` at `http://localhost:4174/student-marketplace/`:

| Check | Result | Notes |
|---|---|---|
| Mock mode loads with no console errors | ✅ | Console empty after the whole flow |
| Demo Login appears in mock and signs in | ✅ | One click, lands on the catalog |
| Empty state | ✅ | "No listings found" with a clear-filters action |
| Search updates the URL | ✅ | Typing `Five` produced `?q=Five` and 1 result |
| Listing details with 5 photos | ✅ | Counter `1 / 5`, 5 thumbnails, seller card |
| Photo viewer opens on click | ✅ | `role="dialog"`, `aria-modal`, scroll locked |
| Arrow buttons navigate and wrap | ✅ | `1/5 → 2/5`, and `2 → 3 → 4 → 5 → 1` |
| Keyboard `ArrowRight` / `Escape` | ✅ | Dispatched `KeyboardEvent` on `document` changed the photo and closed the viewer |
| Swipe | ✅ | Dispatched pointer sequence with a 150 px delta advanced the photo |
| Backdrop click closes | ✅ | Click on the dialog root closes it |
| Body scroll lock and restore | ✅ | `overflow: hidden` while open, restored after close |
| Single-photo listing | ✅ | Viewer shows `1 / 1`, no arrows, no thumbnails |
| No-photo listing | ✅ | Local "No photos yet" placeholder, no open/expand control |
| Create listing | ✅ | Published and navigated to the new listing with the typed title/description |
| Create review | ✅ | Review modal submitted, summary changed to 1 review and 5★ distribution |
| Reduced motion | ❌ | Not visually verified (no media-feature emulation here); `prefers-reduced-motion` is handled in CSS and in the lightbox `matchMedia` check |
| 360 px viewport | ❌ | Not run: the browser tooling in this environment has no viewport emulation. The layout is mobile-first and `BottomNav` renders below 768 px |
| Loading state | ❌ | Only seen as a transient skeleton, not asserted |
| Error state | ❌ | Not triggered; the mock adapter does not fail on demand |
| REST mode end to end | ❌ | Not run. The deployed Render backend is an older build (`/api/client/reviews` returns 404, Flyway `V5` missing) and its CORS allow-list rejects the GitHub Pages origin. It needs a redeploy before this can be checked |

## 7. Limitations and not covered

- **No end-to-end tests.** Everything runs in jsdom; no real browser, no real backend, no real database.
- **REST adapter is not unit-tested.** It is exercised only by type checking and by the manual REST checks from earlier iterations.
- **No visual regression testing.** Styling and responsive behaviour are reviewed by hand, not snapshotted.
- **No zoom in the photo viewer.** It was cut deliberately (allowed by the brief), so there is nothing to test.
- **Focus trap is implemented but only partially verified.** The lightbox cycles Tab inside the dialog; the automated key delivery available here did not reach the page, so the trap is covered by code review rather than by a real keypress.
- **Reduced motion and 360 px are unverified visually** (see the checklist).
- **Coverage is uneven by design.** The mock adapter's auth and CRUD paths, and the canvas resize helper, are untested.

## 8. Conclusions

All 20 required tests pass deterministically in under 6 seconds, and both builds are green. The suite protects the logic most likely to regress during last-minute edits (stats, validation, formatting, mock filters/favorites/reviews) and the interaction contract of the new photo viewer. The one expectation that disagreed with the code was a mistake in the brief, not a defect; it was corrected in the test and documented. The remaining gaps are honest and concentrated in browser-only behaviour and the deployed backend, which is blocked on a redeploy rather than on code.
