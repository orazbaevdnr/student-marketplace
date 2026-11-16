# Student Marketplace — Defense Demo Script (3–4 Minutes)

Click-by-click script for the project defense. Every step uses the real Spring Boot + PostgreSQL stack — there is no demo login and no mock data.

**Before the defense:** start the backend (IntelliJ run configuration or `mvn spring-boot:run -Dspring-boot.run.profiles=dev`), wait for `Started MarketplaceApplication`, then `npm run dev` and open `http://localhost:5173`. If you use PostgreSQL, run `docker compose up -d` first.

---

### Phase 1: Introduction & Registration (40 seconds)

1. **Open `http://localhost:5173`.**
   - Point out the university branding: *"Buy and sell with students from your university"*.
   - Say that the app talks only to the Spring Boot API: React has no data of its own.
2. **Register a new account** on the `/login` page (Sign up tab):
   - Name, e-mail ending with `@kbtu.kz` (the backend enforces `ALLOWED_EMAIL_DOMAIN`), password of 8+ characters.
   - After registering you are signed in automatically: the backend returned a JWT, the frontend stored it and now sends `Authorization: Bearer …` with every request.
3. **Prove the session survives a reload** (`F5`): `GET /api/client/auth/me` restores the user, no re-login.

---

### Phase 2: Catalog Browsing, Search & URL State (60 seconds)

4. **Show the catalog.** Empty at first — the catalog is exactly what is in PostgreSQL.
5. **Register a second account in a private window** (or reuse a seeded seller) and create 2–3 listings in different categories. Each one is a real database row with photos on disk.
6. **Demonstrate filtering & sorting** in the first window:
   - Click the **Textbooks** category pill — the URL becomes `?category=textbooks`.
   - Open **Filters**, choose condition **Like new** and a price range.
   - Change the sort order to **Price: Low to High**.
   - Type a word in the search bar: the 300 ms debounced query goes to `GET /api/client/listings?q=…`.
   - Press `F5`: URL parameters keep every filter.
7. **Clear filters** to return to the full catalog.

---

### Phase 3: Item Details, Favorites & Contact Reveal (45 seconds)

8. **Open a listing.** Show the gallery (photos served by the backend), price in KZT, condition/category badges, and the seller card.
9. **Save it:** the heart calls `POST /api/client/users/me/favorites/{id}/toggle`; the row appears in `favorites`.
10. **Reveal the contact:** `GET /api/client/listings/{id}` returns the seller `contact` only for a logged-in user — open the same URL in an incognito window and show that `contact` is `null` there.
11. **Copy link** — show the toast.

---

### Phase 4: Create a New Listing with Image Upload (45 seconds)

12. **Click “Post listing”.** Fill in:
    - **Title:** `Organic Chemistry 8th Edition (Wade)`
    - **Category:** `Textbooks`, **Condition:** `Like new`
    - **Price:** `4000`, **Contact:** `@demo_student`
    - **Description:** `Barely used textbook for CHEM201. Includes study guide.`
    - Upload 1–2 photos (canvas resizing to 1024 px happens in the browser).
13. **Publish.** The backend generates the id (`L-###`), validates the price and images, writes the photo files and returns the listing; the app navigates to it.

---

### Phase 5: Manage Listings, Mark Sold & the New Tab (45 seconds)

14. **Go to “My listings”.** The new item is under **Active listings**.
15. **Edit it:** change the price and keep the existing photo — show that the image URL round-trips to the backend instead of being re-uploaded.
16. **Mark as Sold:** the item moves to the **Sold items** tab and the badge changes.
17. **Show the “Reserved & hidden” tab:** explain that `reserved` is set when an item is bought through the main API and `hidden` when a seller ignores the 37-day confirmation rule. Both remain visible to the owner so they can be reactivated.
18. **Delete a listing:** confirmation modal → `DELETE /api/client/listings/{id}`.

---

### Phase 6: Favorites, Profile & Responsive View (30 seconds)

19. **`/favorites`** — the listing saved in Phase 3 is still there (loaded from PostgreSQL).
20. **`/profile`** — show the active/sold counters, edit the faculty and Telegram handle, save (`PATCH /api/client/users/me`), then clear the faculty field and save again to show that the backend really clears it.
21. **Responsive preview:** DevTools device toolbar at 360 px shows the bottom navigation bar.

---

### Concluding Note for the Defense

*"The frontend is a pure React client: all state lives in PostgreSQL, the schema is versioned with Flyway and owned by Hibernate mappings, and every request is authenticated with a JWT issued by the Spring Boot backend. The API layer under `src/api/` is the only place that knows about HTTP, so the UI is completely independent of the transport."*
