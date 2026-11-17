# Changes Report

## 1. Summary

This iteration turned the existing Student Marketplace frontend into a deliberately designed product and added the one interaction the demo was missing: a real photo viewer.

- A "campus noticeboard" design system replaced the default indigo/slate template: new colour tokens, two web fonts, restyled UI kit, and a price-tag listing card.
- `picsum.photos` is gone; every missing or broken photo now falls back to a local placeholder.
- A full-screen photo viewer was added on top of the existing gallery, with arrows, keyboard, swipe, thumbnails, wrap-around and three ways to close.
- Vitest, React Testing Library and jsdom were added as devDependencies, and exactly 20 deterministic tests now cover logic, the mock API and the new viewer.
- Both builds stay green, the GitHub Pages mock build still works, and no runtime dependency was added.
- Documentation was extended (`DESIGN_PLAN.md`, `ASSUMPTIONS.md` 7–9, `README.md`, `DEMO_SCRIPT.md`) and two reports were written from real runs.

## 2. Design

**Direction.** "Campus noticeboard": friendly, clear, trustworthy, a little playful. Quiet surfaces, and the boldness spent on two elements — the price tag on listing cards and the photo viewer. No gradient washes, no identical shadow on every card, light theme only.

**Tokens.** CSS variables in `src/index.css`, mapped in `tailwind.config.js`:

| Token | Value | Used for |
|---|---|---|
| `--ink` | `#16213A` | text, headings, dark surfaces |
| `--chalk` | `#F4F6FB` | page background |
| `--surface` | `#FFFFFF` | cards, inputs, modals |
| `--cobalt` | `#2344D8` | primary actions, links, focus ring |
| `--sun` | `#F5B700` | rating caps, price-tag accent |
| `--mint` | `#1FA67A` | success, verified, positive tags |
| `--coral` | `#E5484D` | errors, destructive actions, favorite heart |

Borders and muted text derive from `--ink` at low opacity. The existing `primary` and `indigo` Tailwind ramps were remapped to cobalt, and `slate` to an ink/chalk neutral ramp, so every page changed consistently before component-level refinement. `amber`, `emerald` and `rose` were **not** remapped blindly: rating caps and badges were moved to `sun`, success to `mint`, errors and favorites to `coral`.

**Typography.** Bricolage Grotesque for headings, logo and prices; Manrope for body, forms and buttons, loaded from Google Fonts with `display=swap` and system fallbacks. Scale 12/14/16/20/28/40, prices in the display font with tabular numerals.

**Restyled.** `Button`, `Input`, `Select`, `Badge`, `Modal`, `Toast`, `Skeleton`, `EmptyState`, `Dropdown`; `Header`, `BottomNav`, `Layout`; `ListingCard`, `ListingGrid`, `Filters`, `Gallery`, `ListingDetails`, `Login`, `ListingForm`, `Profile`; all review components (`RatingIcons`, `RatingSummary`, `ReviewCard`, `ReviewList`, `ReviewModal`, `SellerBadges`, `TagChips`, `TopSellers`).

**The card.** Fixed 4:3 photo with lazy/async loading, a price tag overlapping the bottom-left corner (display font, tabular numbers, notch detail), the duplicate price removed from the text block, two-line title, condition/category badges, and a heart top-right. There is deliberately no seller-rating chip: the listing DTO has no stats and per-card profile calls are forbidden.

**Before / after.**

- *Catalog:* indigo pills and a plain card grid → cobalt category pills, a filter bottom sheet with removable chips, and price-tag cards on a chalk background.
- *Listing details:* price buried in the info column → price as the loudest element, a cleaner seller card, and a gallery that opens full screen.
- *Login:* centered generic form → a split layout with a brand panel on desktop and a compact mobile header, Demo Login only in mock mode.
- *Forms and empty states:* system font and grey boxes → Manrope labels, visible focus rings, and empty states that invite the next action.

**Accessibility.** Visible `:focus-visible` ring (cobalt, 2 px offset) on interactive elements, 4.5:1 body text contrast, semantic buttons instead of clickable divs where possible, `aria-pressed` on toggles, `aria-live` on the photo counter, and `prefers-reduced-motion` collapsing transitions. **Images:** a new `SafeImage` component replaces `picsum.photos` and shows a local "No photos yet" / "Photo unavailable" placeholder.

## 3. Photo viewer

`src/components/listings/Lightbox.tsx` is rendered through a React portal on `document.body` with `role="dialog"` and `aria-modal="true"`. `Gallery` opens it on a click, `Enter` or `Space` on the main image, or from the Expand button, and passes the current photo as `startIndex`.

Supported interactions:

- **Arrows** — previous/next buttons appear only when there is more than one photo and navigation wraps at both ends.
- **Keyboard** — `ArrowRight` / `ArrowLeft` navigate, `Escape` closes, and `Tab` / `Shift+Tab` cycle inside the dialog.
- **Swipe** — pointer events with a 50 px threshold; pointer capture is feature-detected and guarded, and a completed swipe does not also trigger the gallery's click-to-open.
- **Thumbnails** — the strip switches photos, marks the active one with `aria-current`, and scrolls it into view when supported.
- **Counter** — visible `n / total` plus a screen-reader-only `aria-live` announcement.
- **Closing** — the X button, `Escape`, or a click on the backdrop (the dialog root or the empty stage around the image).
- **Zoom** — not implemented; cut deliberately as allowed by the brief.

Accessibility and performance details: body scroll is locked while open and the previous value is restored on close; focus moves to the close button and returns to the opener on unmount; the neighbouring photos are preloaded; transitions are disabled under reduced motion and while dragging; `matchMedia`, `setPointerCapture` and `scrollIntoView` are all guarded so jsdom and older browsers do not throw.

Known limitations: no pinch zoom, no caption or download action, and focus return assumes the opener was focused (a real mouse click focuses the focusable gallery surface).

## 4. Tests

`TEST_REPORT.md` is the full report. Headline numbers: **8 files, 20 tests, 20 passed**, `npm test` in 5.04 s; overall coverage **51.71 % statements, 49.85 % branches, 51.58 % functions, 54.62 % lines**; `Lightbox.tsx` at 73.10 % statements / 92.85 % functions. One expectation in the brief contradicted the code (two 5-star reviews produce `5`, not `0`) and was corrected in the test; a duplicate `+` in the "Post listing" button was found manually and fixed.

## 5. Changed and added files

### Added

| File | Purpose |
|---|---|
| `DESIGN_PLAN.md` | The design direction, tokens, type and rules, written before the code |
| `src/components/listings/Lightbox.tsx` | Full-screen photo viewer (portal, keyboard, swipe, thumbnails, focus trap) |
| `src/components/ui/SafeImage.tsx` | Local image fallback that replaced `picsum.photos` |
| `src/components/listings/Lightbox.test.tsx` | 2 tests for the viewer |
| `src/components/reviews/RatingIcons.test.tsx` | 1 test for click/keyboard rating |
| `src/auth/ProtectedRoute.test.tsx` | 2 tests for route protection |
| `src/api/mockAdapter.test.ts` | 5 tests for filtering, sorting, favorites and review rules |
| `src/utils/reviews.test.ts` | 4 tests for seller statistics |
| `src/utils/validation.test.ts` | 3 tests for listing validation |
| `src/utils/format.test.ts` | 2 tests for price and date formatting |
| `src/hooks/useDebounce.test.tsx` | 1 test for the 300 ms debounce |
| `src/test/setup.ts` | Cleanup, `localStorage.clear`, `matchMedia` and `PointerEvent` polyfills |
| `src/test/vitest.d.ts` | jest-dom matcher types for `tsc` |
| `vitest.config.ts` | jsdom environment and setup file |
| `TEST_REPORT.md` | Test results, all 20 tests, limitations |
| `CHANGES_REPORT.md` | This report |

### Modified

| File | Change |
|---|---|
| `src/index.css` | Tokens, base typography, reduced-motion rules |
| `tailwind.config.js` | Semantic palettes, remaps, font families, radius |
| `index.html` | Font `<link>` tags, title, theme colour |
| `package.json`, `package-lock.json` | Test scripts and devDependencies only |
| `.gitignore` | Ignore `coverage/` |
| `src/components/ui/Button.tsx` | Cobalt variants and focus ring |
| `src/components/ui/Input.tsx` | Manrope labels, coral errors, focus ring |
| `src/components/ui/Select.tsx` | Matching field styling |
| `src/components/ui/Badge.tsx` | Semantic category/condition/status colours |
| `src/components/ui/Modal.tsx` | Surface, radius, heading font |
| `src/components/ui/Toast.tsx` | Ink surface and semantic accents |
| `src/components/ui/Skeleton.tsx` | Card skeleton matches the price-tag card |
| `src/components/ui/EmptyState.tsx` | Friendlier copy and action slot |
| `src/components/ui/Dropdown.tsx` | Surface/border tokens |
| `src/components/layout/Header.tsx` | New logo/wordmark, search and actions |
| `src/components/layout/BottomNav.tsx` | Cobalt active state, safe-area padding |
| `src/components/layout/Layout.tsx` | Chalk page background |
| `src/components/listings/ListingCard.tsx` | Price tag, local fallback, heart animation |
| `src/components/listings/Filters.tsx` | Bottom sheet on mobile, active chips, inline panel on desktop |
| `src/components/listings/Gallery.tsx` | Click/Enter/Space opens the viewer, swipe, indicator, thumbnails, empty state |
| `src/pages/ListingDetails.tsx` | Restyled gallery/info/seller sections and review section |
| `src/pages/Login.tsx` | Split layout; Demo Login gated by `isMockMode` |
| `src/pages/ListingForm.tsx` | Uses `validateListingDraft`; restyled fields |
| `src/pages/Profile.tsx` | Token colours in the stats cards |
| `src/components/reviews/RatingIcons.tsx` | Sun-coloured caps, interactive keyboard support |
| `src/components/reviews/RatingSummary.tsx` | Tokens, new-seller vs rated layout |
| `src/components/reviews/ReviewCard.tsx` | Tokens, avatar fallback, listing snapshot chip |
| `src/components/reviews/ReviewList.tsx` | Token colours and empty state |
| `src/components/reviews/ReviewModal.tsx` | Tokens, tag filtering by rating |
| `src/components/reviews/SellerBadges.tsx` | Semantic badge colours |
| `src/components/reviews/TagChips.tsx` | Mint/coral selected states |
| `src/components/reviews/TopSellers.tsx` | Tokens and avatar fallback |
| `src/utils/reviews.ts` | Rating colours moved to tokens; stats unchanged |
| `src/utils/validation.ts` | Added `ListingDraft`, `ListingDraftErrors`, `validateListingDraft` |
| `src/i18n/strings.ts` | `nav.postListing` is `Post listing` (no duplicated `+`) |
| `ASSUMPTIONS.md` | Appended sections 7–9 |
| `README.md` | Added the Tests subsection, corrected the mock-mode statement |
| `DEMO_SCRIPT.md` | Added Phase 7 and the 20-test note |

## 6. Decisions and assumptions

- **No seller-rating chip on listing cards.** The listing DTO has no stats and a per-card profile request is forbidden; the chip was skipped.
- **Palette remap instead of a 30-file rewrite.** `primary`/`indigo` → cobalt and `slate` → ink/chalk; `amber`/`emerald`/`rose` were migrated explicitly to `sun`/`mint`/`coral` where semantics mattered.
- **Local fallback instead of a remote placeholder.** `SafeImage` renders an icon and label; no external image service is contacted.
- **Validation extraction.** `validateListingDraft` is a pure function in `src/utils/validation.ts`; `ListingForm` calls it. Messages are unchanged.
- **Zoom was cut.** It is the first allowed cut and adds little to the demo.
- **The lightbox owns its portal and focus trap.** `Modal` has neither, and the brief requires them for the viewer.
- **Test #2 was adapted to the code.** `averageRating` is `0` only with zero reviews; two reviews still produce a numeric average. Recorded in `ASSUMPTIONS.md`.
- **Mock tests seed `localStorage`.** `SEED_LISTINGS` and `SEED_USERS` are empty; tests write their own fixtures and use `MockApiClient` directly, never the `api` singleton.
- **`postListing` string fixed.** Both call sites render a `Plus` icon, so the label must not start with `+`.

## 7. Known issues and future ideas

- **Deployed Render backend is outdated.** `/api/client/reviews` returns 404 and Flyway `V5` is missing; it needs a manual redeploy. Its CORS allow-list also rejects `https://orazbaevdnr.github.io`, so Pages + Render API needs `CORS_ORIGINS` configured.
- **Deployed Render frontend is an older build** and needs a redeploy to show this iteration.
- **Lighthouse was not run** in this environment.
- **360 px was not emulated** here; the layout is mobile-first and reviewed through its classes, not through a device viewport.
- **No dark theme**, no lightbox zoom, no pinch gesture.
- **Future ideas:** E2E tests for the real backend, visual regression snapshots, an image CDN with `srcset`, and a sticky mobile action bar on listing details.

## 8. How to run

```bash
cd student-marketplace-main
npm install

# REST mode: start the Spring Boot backend on :8080 first
npm run dev            # http://localhost:5173

# Production build
npm run build

# GitHub Pages mock build (VITE_USE_MOCK=true, base /student-marketplace/)
npm run build:pages

# Tests
npm test
npm run test:coverage
```
