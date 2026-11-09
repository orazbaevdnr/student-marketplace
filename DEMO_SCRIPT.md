# Student Marketplace — Defense Demo Script (3–4 Minutes)

This click-by-click script is designed for your university project defense. Follow each step to demonstrate the main end-to-end user scenario smoothly without unexpected issues.

---

### Phase 1: Introduction & Instant Login (30 seconds)
1. **Open the browser at:** `http://localhost:5173`
   - If not logged in, you will be on the `/login` page.
   - Point out the clean university-oriented branding: *"Buy and sell with students from your university"*.
   - Mention the authentication options: Email + Password (with no domain restrictions), Google OAuth, Microsoft OAuth with organization failure handling.
2. **Click "Demo Login (Instant Access)":**
   - Click the prominent indigo button.
   - You are immediately authenticated as **Demo Student** and redirected to `/`.
   - A success toast appears at the bottom-right.
   - Point out that protected routes guard all views and maintain security.

---

### Phase 2: Catalog Browsing, Search & URL State (60 seconds)
3. **Show the Catalog:**
   - Note the 25+ realistic items across textbooks, electronics, dorm gear, clothing, and sports.
   - Point out the non-blocking **email verification banner** at the top.
4. **Demonstrate Filtering & Sorting:**
   - Click the **"Textbooks"** category pill. Notice the URL updates to `?category=textbooks`.
   - Click the **"Filters"** button to open extra criteria. Select condition **"Like new"** or set a price filter.
   - Change sort order to **"Price: Low to High"**.
   - Type `"Calculus"` in the search bar. Observe the smooth 300ms debounced search filtering results in real time.
   - Refresh the browser page (`F5`) — show the committee that URL parameters persisted all your filters!
5. **Clear Filters:**
   - Click **"Clear filters"** to restore all items.

---

### Phase 3: Item Details, Favorites & Contact Reveal (45 seconds)
6. **Open an Item Card:**
   - Click any item (e.g. *"Sony WH-1000XM4 Noise Cancelling Headphones"* or *"Campbell Biology"*).
   - Point out the photo gallery: click through thumbnail previews to switch the main image.
   - Show the seller information card (name, faculty, verified student badge).
7. **Toggle Favorite:**
   - Click the **"Save"** (Heart) button.
   - A toast confirms *"Added to favorites"*.
8. **Reveal Contact:**
   - Click **"Show contact info"**.
   - Show the revealed Telegram handle/email for campus meetups.
   - Click **"Copy link"** — show the toast notification.

---

### Phase 4: Create a New Listing with Image Upload (45 seconds)
9. **Post a New Item:**
   - Click the **"+ Post listing"** button in the header.
   - Fill out the form:
     - **Title:** `Organic Chemistry 8th Edition (Wade)`
     - **Category:** `Textbooks`
     - **Condition:** `Like new`
     - **Price:** `35`
     - **Contact:** `@demo_student`
     - **Description:** `Barely used textbook for CHEM201. Includes study guide and solution manual.`
   - Upload 1 or 2 sample images (or drag and drop). Notice client-side automatic optimization to 1024px.
   - Click **"Publish listing"**.
   - The app navigates directly to the new listing's page with a success toast!

---

### Phase 5: Manage Listings, Mark Sold & Delete (45 seconds)
10. **Navigate to "My listings":**
    - Click user profile avatar at top-right -> select **"My listings"** (or use bottom bar on mobile).
    - See your newly created item under the **"Active listings"** tab.
11. **Edit the Listing:**
    - Click **"Edit"**. Change price to `30`.
    - Click **"Save changes"**. Notice the price updates immediately.
12. **Mark as Sold:**
    - Click **"Mark as Sold"**.
    - The item immediately transitions to the **"Sold items"** tab and displays the grayscale sold badge.
13. **Delete Listing:**
    - Click the trash icon.
    - An accessible confirmation modal appears: *"Delete this listing?"*.
    - Click **"Delete listing"** — item is safely removed.

---

### Phase 6: Favorites, Profile & Responsive Mobile View (30 seconds)
14. **Check Favorites:**
    - Go to `/favorites`.
    - Point out the saved headphones item from Phase 3.
15. **Check Profile:**
    - Go to `/profile`.
    - Show student stats (number of active/sold items).
    - Edit faculty or Telegram handle and click **"Save profile"**.
16. **Responsive Preview:**
    - Open Chrome DevTools (`F12`), toggle Device Toolbar (`Ctrl+Shift+M`) to iPhone / 360px.
    - Show the mobile **Bottom Navigation** bar for thumb-friendly mobile navigation.

---

### Concluding Note for the Defense
*"Our architecture completely decouples the UI from the data layer via `src/api/`. It currently runs autonomously in mock mode with localStorage persistence, and can be connected to the backend REST API tomorrow by simply toggling `VITE_USE_MOCK=false`."*
