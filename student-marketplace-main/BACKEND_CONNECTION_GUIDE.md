# Backend Connection Guide

The frontend connects to the Spring Boot backend via the Vite dev proxy.

## Quick Start

### 1. Start the backend

**Option A — in-memory H2 (no PostgreSQL needed):**
```bash
cd student-marketplace-back/student-marketplace
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Option B — PostgreSQL via Docker:**
```bash
cd student-marketplace-back/student-marketplace
docker-compose up -d
mvn spring-boot:run
```

Backend listens on **http://localhost:8080**.

### 2. Start the frontend
```bash
cd student-marketplace-front/student-marketplace-main
npm install
npm run dev
```

Frontend listens on **http://localhost:5173**.  
The Vite dev server automatically proxies all `/api/*` requests to `http://localhost:8080`.

## Environment Variables

Copy `.env.example` to `.env` (already done). The only required variable:
```
VITE_API_BASE_URL=/api/client
```

## API Contract

All backend endpoints live under `/api/client/`:
- `POST /api/client/auth/login` — login, returns JWT token + user object
- `POST /api/client/auth/register` — register, returns JWT token + user object
- `GET  /api/client/auth/me` — get current user (requires Bearer token)
- `GET  /api/client/listings` — browse catalog (public)
- `GET  /api/client/listings/:id` — single listing (public)
- `POST /api/client/listings` — create listing (auth required)
- `PUT  /api/client/listings/:id` — update listing (auth required, owner only)
- `DELETE /api/client/listings/:id` — delete listing (auth required, owner only)
- `PATCH /api/client/listings/:id/status` — mark sold/active
- `GET  /api/client/users/:userId` — user profile (auth required)
- `PATCH /api/client/users/:userId` — update profile (auth required, self only)
- `GET  /api/client/users/:userId/listings` — user's listings
- `GET  /api/client/users/:userId/favorites` — user's favorites
- `POST /api/client/users/:userId/favorites/:listingId/toggle` — toggle favorite

## Authentication

The frontend stores the JWT in `localStorage` as `sm_access_token` and sends it as `Authorization: Bearer <token>` on every protected request.

## Swagger UI

When the backend is running: http://localhost:8080/swagger-ui.html
