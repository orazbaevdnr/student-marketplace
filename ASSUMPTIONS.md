# Engineering Assumptions & Design Decisions

This document logs all defaults and decisions chosen autonomously to ensure a robust, crash-free presentation defense.

---

### 1. Authentication & Demo Resilience
- **Demo Mode Default:** Defaulted to `VITE_ENABLE_DEMO_LOGIN=true` and `VITE_USE_MOCK=true`. If Firebase credentials are missing or network access fails during the live presentation, users can log in with a single click as `Demo Student` without hitting external identity providers.
- **Firebase Error Degradation:** Initializing Firebase in `src/auth/firebase.ts` does not crash if config values are blank. The app logs a warning and falls back to mock authentication.
- **No Email Domain Restriction:** Any valid email address (e.g. `@gmail.com`, `@outlook.com`, `@university.edu`) is permitted for registration and login.
- **Email Verification is Non-Blocking:** In accordance with the prompt, unverified users retain 100% functionality. A small dismissible amber banner is shown at the top of the app, and the `/verify-email` page contains a prominent "Skip for now" button that forwards directly to the catalog.
- **Microsoft Organization Error Handling:** Microsoft OAuth errors (such as tenant admin approval restrictions) are intercepted and translated to the user-friendly message specified in the prompt: *"This Microsoft account can't sign in here (your organization may block it). Use email or Google instead."*

### 2. Data Persistence & Quota Protection
- **localStorage Storage Schema:**
  - `student_marketplace_listings_v1`: stores all active and sold listings.
  - `student_marketplace_users_v1`: stores user profile data.
  - `student_marketplace_favs_<userId>`: stores saved listing IDs per user.
  - `student_marketplace_active_user_v1`: persists the active session across browser refreshes.
- **Client-Side Image Optimization:** Images uploaded via the form (up to 5MB, JPG/PNG/WebP) are scaled down in memory via HTML5 Canvas to a maximum dimension of 1024px with 82% JPEG quality before being saved as data URLs. This prevents exceeding browser `localStorage` quotas (typically 5MB).
- **Realistic Network Latency:** In mock mode, requests simulate a 300–600ms network round-trip delay to showcase Skeleton loaders and button spinners during the defense.

### 3. UI/UX & Responsive Layout
- **Design System:** Primary accent is Indigo (`indigo-600`), with Emerald for success/verified badges and Rose for favorites. Neutral slate grays are used throughout for readability.
- **Mobile-First Experience (360px+):**
  - Desktop: full top navigation with debounced search bar and user dropdown menu.
  - Mobile (screens < 768px): fixed bottom navigation bar (`BottomNav`) with instant access to Home, Favorites, Post Listing, My Listings, and Profile.
- **URL Parameter State Synchronization:** Catalog search terms (`q`), category, condition, min/max prices, and sort order are synchronized bidirectionally with URL query parameters so that browser refresh and back/forward navigation preserve active filters.
- **Optimistic Favorites:** Clicking the heart icon updates UI state immediately and rolls back only in the unlikely event of an API error.

### 4. Internationalization (i18n)
- All user-facing strings are centralized in `src/i18n/strings.ts`. No hardcoded strings exist inside page components, allowing future multi-language localization (e.g. Russian / Kazakh / Spanish) by simply adding translation dictionaries.
