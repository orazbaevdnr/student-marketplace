# Student Marketplace — Frontend

A university campus marketplace web application where students buy and sell textbooks, electronics, dorm essentials, furniture, clothes, and sports gear.

Built with **React 18 + Vite + TypeScript**, **Tailwind CSS**, **React Router v6**, **Firebase Auth**, and **Lucide React**.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

By default, the application runs in **Mock Mode** (`VITE_USE_MOCK=true`) with **Demo Login** enabled (`VITE_ENABLE_DEMO_LOGIN=true`), so no Firebase configuration or backend setup is required for local testing or immediate presentation defense!

### 3. Run development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for production
```bash
npm run build
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_USE_MOCK` | `true` | When `true`, uses the client-side mock adapter with localStorage persistence and realistic loading delays. Set to `false` to connect to a real backend REST API. |
| `VITE_ENABLE_DEMO_LOGIN` | `true` | Shows 1-click **Demo Login** button on `/login` for seamless demonstration without needing credentials. |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the backend REST API when `VITE_USE_MOCK=false`. |
| `VITE_FIREBASE_API_KEY` | *(empty)* | Firebase Web API Key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | *(empty)* | Firebase Auth Domain (e.g. `your-project.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | *(empty)* | Firebase Project ID. |
| `VITE_FIREBASE_APP_ID` | *(empty)* | Firebase App ID. |

---

## Firebase Setup Guide

When connecting live Firebase authentication:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Under **Build > Authentication > Sign-in method**:
   - **Email/Password:** Enable Email/Password (Email link is optional).
   - **Google:** Enable Google provider and configure support email.
   - **Microsoft:** Enable Microsoft provider (OAuth).
3. Under **Authentication > Settings > Authorized domains**:
   - Ensure `localhost` is listed (it is added by default).
4. In **Project settings > General > Your apps**, register a Web app (`</>`) and copy the config credentials into your `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_APP_ID=1:123456...
   ```
5. Note: If Firebase credentials are not provided or Firebase is unreachable, the application gracefully handles it and keeps the demo working via **Demo Login**.

---

## Switching Between Mock & Real Backend

The data layer is completely abstracted behind `src/api/` (`ApiClient` interface):

- **Mock Adapter (`src/api/mockAdapter.ts`):**
  Uses 25+ realistic pre-seeded student listings, 5 mock sellers, persistent updates in `localStorage`, and an artificial 300–600ms latency to demonstrate realistic skeletons and loading states.
- **REST Adapter (`src/api/restAdapter.ts`):**
  Connects to a real REST backend matching the endpoints defined in `API_CONTRACT.md`.
- **To switch to Real Backend:**
  Set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL=https://your-api.com` in `.env`.

---

## Project Structure

```
src/
  api/
    types.ts            # Data models, query params, ApiClient contract
    seed.ts             # 25+ realistic listings and mock student profiles
    mockAdapter.ts      # Client-side mock API with localStorage persistence
    restAdapter.ts      # REST API implementation
    index.ts            # Singleton API client selector based on VITE_USE_MOCK
  auth/
    firebase.ts         # Firebase initialization with graceful fallback
    AuthContext.tsx     # Session management (Demo, Email, Google, Microsoft)
    ProtectedRoute.tsx  # Guard for private routes with return-path redirect
    errors.ts           # Friendly error messages mapping
  components/
    ui/                 # Button, Input, Select, Badge, Modal, Toast, Skeleton, EmptyState, Dropdown
    layout/             # Header, BottomNav, EmailVerificationBanner, Layout
    listings/           # ListingCard, ListingGrid, Filters, ImageUploader, Gallery
  pages/
    Login.tsx           # Sign in, Sign up, Google/Microsoft, 1-click Demo, Forgot password
    VerifyEmail.tsx     # Optional skippable verification screen
    Catalog.tsx         # Main catalog with search, filters, sorting, load more
    ListingDetails.tsx  # Item details, gallery, seller contact, owner controls
    ListingForm.tsx     # Create & edit listing with client-side image compression
    MyListings.tsx      # Active / Sold tabs, mark as sold, delete modal
    Favorites.tsx       # Saved items grid with instant toggle
    Profile.tsx         # User details, stats (active/sold), Telegram handle
    NotFound.tsx        # 404 page
  hooks/
    useDebounce.ts      # Debounced search (300ms)
    useFavorites.ts     # Optimistic favorites toggle and state
  i18n/
    strings.ts          # Centralized UI strings dictionary
  utils/
    format.ts           # Price, relative date, initials formatting
    validation.ts       # Input validation & client image resize (1024px max)
```
