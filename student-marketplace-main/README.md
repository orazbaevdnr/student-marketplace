# Student Marketplace — Frontend

A university campus marketplace web application where students buy and sell textbooks, electronics, dorm essentials, furniture, clothes, and sports gear.

Built with **React 18 + Vite + TypeScript**, **Tailwind CSS**, **React Router v7**, and **Lucide React**. Data and authentication come from the Spring Boot backend (PostgreSQL, Flyway, JWT).

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

Start the Spring Boot backend first (`mvn spring-boot:run -Dspring-boot.run.profiles=dev` or Docker Compose with PostgreSQL). Vite proxies `/api` to `http://localhost:8080`.

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
| `VITE_API_BASE_URL` | `/api/client` | Base URL of the Spring Boot API. `/api/client` works both in development (Vite proxies `/api` to `http://localhost:8080`) and in production (Nginx proxies it on the same origin). |
| `VITE_BASE_PATH` | `/` | Public path of the built app, e.g. `/marketplace/` when served from a sub-directory. |

There is no mock mode and no client-side persistence: every screen reads and writes the backend.

---

## Authentication

Authentication is **JWT only**, issued by the Spring Boot backend:

1. `POST /api/client/auth/login` (or `/register`) returns `{ token, tokenType, expiresInSeconds, user }`.
2. `src/auth/session.ts` stores the token in `localStorage` under `sm_access_token`.
3. `src/api/restAdapter.ts` sends `Authorization: Bearer <token>` on every request.
4. `GET /api/client/auth/me` restores the session on page reload; a `401` clears the token and returns the user to `/login`.
5. `src/auth/ProtectedRoute.tsx` guards the private routes.

Passwords are hashed with BCrypt on the server; the frontend never stores or validates credentials beyond the minimum length check.

---

## Data Layer

All requests go through `src/api/`:

- `types.ts` — the `ApiClient` interface, the DTO types and the contract the backend implements;
- `restAdapter.ts` — the only implementation, talking to `/api/client/*`;
- `index.ts` — exports the `api` singleton.

`API_CONTRACT.md` is the authoritative description of the HTTP endpoints.

---

## Project Structure

```
src/
  api/
    types.ts            # Data models, query params, ApiClient contract
    restAdapter.ts      # REST API implementation (JWT + /api/client)
    index.ts            # `api` singleton
  auth/
    AuthContext.tsx     # Session state: signIn, signUp, signOut, updateCurrentUser
    ProtectedRoute.tsx  # Guard for private routes with return-path redirect
    session.ts          # JWT storage in localStorage + "auth expired" event
    errors.ts           # Friendly error messages mapping
  components/
    ui/                 # Button, Input, Select, Badge, Modal, Toast, Skeleton, EmptyState, Dropdown
    layout/             # Header, BottomNav, Layout
    listings/           # ListingCard, ListingGrid, Filters, ImageUploader, Gallery
  pages/
    Login.tsx           # Sign in / sign up (email + password)
    Catalog.tsx         # Main catalog with search, filters, sorting, load more
    ListingDetails.tsx  # Item details, gallery, seller contact, owner controls
    ListingForm.tsx     # Create & edit listing with client-side image compression
    MyListings.tsx      # Active / Sold / Reserved & hidden tabs, mark as sold, delete
    Favorites.tsx       # Saved items grid with instant toggle
    Profile.tsx         # User details, stats (active/sold), Telegram handle
    NotFound.tsx        # 404 page
  hooks/
    useDebounce.ts      # Debounced search (300ms)
    useFavorites.ts     # Optimistic favorites toggle and state
  i18n/
    strings.ts          # Centralized UI strings dictionary
  utils/
    format.ts           # Price, date, initials formatting
    validation.ts       # Input validation & client image resize (1024px max)
```

---

## Deployment

The production stack (Nginx + React + Spring Boot + PostgreSQL) lives in [`deploy/`](deploy/):

- [`deploy/DEPLOYMENT.md`](deploy/DEPLOYMENT.md) — step-by-step deployment, HTTPS, backups, operations;
- [`deploy/SECURITY_REVIEW.md`](deploy/SECURITY_REVIEW.md) — security findings, fixes and residual risks;
- [`deploy/docker-compose.prod.yml`](deploy/docker-compose.prod.yml) — the production Compose file.

```bash
cd deploy
cp .env.prod.example .env.prod      # fill in the secrets
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Only ports 80/443 are published; the backend and PostgreSQL stay on the internal Docker network.
