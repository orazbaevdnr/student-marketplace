# Student Marketplace — API Contract

This document defines the REST API contract matching `src/api/types.ts` and `src/api/restAdapter.ts`. The Spring Boot backend implements it under `/api/client/**`; the repository contains no client-side mock or alternate data source.

Base URL: `/api/client` (configured by `VITE_API_BASE_URL`; in development Vite proxies `/api` to `http://localhost:8080`, in production Nginx proxies it on the same origin).

All endpoints except `POST /auth/register`, `POST /auth/login` and the public `GET /listings*` endpoints require `Authorization: Bearer <token>`.

---

## 0. Authentication Endpoints

### 0.1 Register
- **Method:** `POST`
- **Path:** `/auth/register`
- **Body:** `{ "email": "student@kbtu.kz", "password": "Password123", "name": "Alex Morgan" }`
- **Response:** `201 Created`
```json
{ "token": "eyJ...", "tokenType": "Bearer", "expiresInSeconds": 3600, "user": { /* User */ } }
```

### 0.2 Login
- **Method:** `POST`
- **Path:** `/auth/login`
- **Body:** `{ "email": "student@kbtu.kz", "password": "Password123" }`
- **Response:** `200 OK` — same shape as register. `401` for a wrong e-mail or password.

### 0.3 Current User
- **Method:** `GET`
- **Path:** `/auth/me`
- **Response:** `200 OK` returns the `User` of the bearer token; `401` when the token is missing or expired.

---

## 1. Common Types & Enums

### Condition
```json
"new" | "like_new" | "good" | "fair"
```

### Category
```json
"textbooks" | "electronics" | "furniture" | "clothes" | "dorm_home" | "sports" | "other"
```

### ListingStatus
```json
"active" | "sold" | "reserved" | "hidden"
```
`reserved` is set when an item is bought through the main API and `hidden` when the seller did not confirm a listing for 37 days. The frontend can only request `sold` and `active`.

### User Object
```json
{
  "id": "string (numeric id as text)",
  "name": "string",
  "email": "string (only for your own profile)",
  "avatarUrl": "string (optional)",
  "faculty": "string (optional)",
  "year": 1,
  "telegram": "string (optional)",
  "emailVerified": true
}
```

### Listing Object
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "price": 45,
  "category": "textbooks",
  "condition": "like_new",
  "images": [
    "https://example.com/image1.jpg"
  ],
  "status": "active",
  "sellerId": "42",
  "seller": {
    "id": "42",
    "name": "Alex Morgan",
    "avatarUrl": "https://example.com/avatar.jpg",
    "faculty": "Computer Science"
  },
  "contact": "@alex_m_cs",
  "createdAt": "2026-11-01"
}
```

`createdAt` is a calendar date (`YYYY-MM-DD`), not a timestamp. `contact` is `null` for anonymous visitors.

---

## 2. Listings Endpoints

### 2.1 Get Listings (Catalog)
- **Method:** `GET`
- **Path:** `/listings`
- **Query Parameters:**
  - `q` (string, optional): search term matching title or description
  - `category` (Category, optional): filter by category
  - `condition` (Condition, optional): filter by condition
  - `minPrice` (number, optional): minimum price
  - `maxPrice` (number, optional): maximum price
  - `sort` (string, optional): `"newest"` (default) | `"price_asc"` | `"price_desc"`
  - `page` (number, optional): 1-indexed page number (default: 1)
  - `pageSize` (number, optional): items per page (default: 12)

- **Response:** `200 OK`
```json
{
  "items": [ /* Array of Listing objects */ ],
  "total": 25,
  "page": 1,
  "pageSize": 12
}
```

### 2.2 Get Single Listing
- **Method:** `GET`
- **Path:** `/listings/:id`
- **Response:** `200 OK`
```json
/* Single Listing object */
```
- **Error Response:** `404 Not Found` if listing does not exist.

### 2.3 Create Listing
- **Method:** `POST`
- **Path:** `/listings`
- **Request Body** (the seller is always the owner of the bearer token; unknown fields are ignored):
```json
{
  "title": "Calculus Early Transcendentals 14th Ed",
  "description": "Mint condition, used for Calc 1",
  "price": 4000,
  "category": "textbooks",
  "condition": "like_new",
  "images": ["data:image/jpeg;base64,..."],
  "contact": "@student_handle"
}
```
- `price` is a whole number of KZT, at least 1.
- `images` accepts up to 5 entries: data URLs for new photos (`data:image/png|jpeg|webp;base64,...`, max 5 MB each) and, on update, the URLs returned by the API for photos to keep.
- **Response:** `201 Created` returns the created `Listing` object with generated `id`, `status: "active"` and `createdAt`.

### 2.4 Update Listing
- **Method:** `PUT`
- **Path:** `/listings/:id`
- **Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "price": 35,
  "category": "textbooks",
  "condition": "good",
  "images": ["https://..."],
  "contact": "@new_contact"
}
```
- **Response:** `200 OK` returns updated `Listing` object.

### 2.5 Delete Listing
- **Method:** `DELETE`
- **Path:** `/listings/:id`
- **Response:** `200 OK`
```json
{
  "success": true
}
```

### 2.6 Update Listing Status (Mark as sold / Reactivate)
- **Method:** `PATCH`
- **Path:** `/listings/:id/status`
- **Request Body:**
```json
{
  "status": "sold"
}
```
- **Response:** `200 OK` returns updated `Listing` object with new status.

---

## 3. User & Favorites Endpoints

### 3.1 Get User's Own Listings
- **Method:** `GET`
- **Path:** `/users/:userId/listings`
- **Response:** `200 OK`
```json
[
  /* Array of Listing objects belonging to :userId */
]
```

### 3.2 Get User's Favorites
- **Method:** `GET`
- **Path:** `/users/:userId/favorites`
- **Response:** `200 OK`
```json
[
  /* Array of Listing objects bookmarked by :userId */
]
```

### 3.3 Check If Listing is Favorite
- **Method:** `GET`
- **Path:** `/users/:userId/favorites/:listingId`
- **Response:** `200 OK`
```json
{
  "isFavorite": true
}
```

### 3.4 Toggle Favorite
- **Method:** `POST`
- **Path:** `/users/:userId/favorites/:listingId/toggle`
- **Response:** `200 OK`
```json
{
  "isFavorite": true
}
```

### 3.5 Get User Profile
- **Method:** `GET`
- **Path:** `/users/:userId`
- **Response:** `200 OK`
```json
{
  "id": "user_demo",
  "name": "Demo Student",
  "email": "demo.student@univ.edu",
  "avatarUrl": "https://...",
  "faculty": "Software Engineering",
  "year": 3,
  "telegram": "@demo_student",
  "emailVerified": true
}
```

### 3.6 Update User Profile
- **Method:** `PATCH`
- **Path:** `/users/:userId`
- **Request Body:**
```json
{
  "name": "Alex Morgan",
  "faculty": "Computer Science",
  "year": 4,
  "telegram": "@alex_m_cs"
}
```
- **Response:** `200 OK` returns updated `User` object.

---

## 4. Reviews and seller profiles

Reviews are stored on the server, so every device and account sees the same feedback.
All endpoints require a Bearer token.

### 4.1 List reviews
- **Method:** `GET`
- **Path:** `/reviews`
- **Query:** `sellerId`, `reviewerId`, `listingId`, `page` (1-based), `pageSize` (max 100)
- **Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "12",
      "sellerId": "4",
      "reviewerId": "7",
      "listingId": "L-101",
      "listingTitle": "Calculus 8th Edition",
      "reviewerName": "Client reviewer",
      "reviewerAvatarUrl": null,
      "rating": 5,
      "tags": ["as_described", "fast_reply"],
      "comment": "Book was exactly as described.",
      "createdAt": "2026-11-17T10:00:00Z",
      "updatedAt": "2026-11-17T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

### 4.2 Reviews of one seller
- **Method:** `GET`
- **Path:** `/sellers/:sellerId/reviews`
- **Response:** `200 OK` returns an array of `Review` objects.

### 4.3 My review for a listing
- **Method:** `GET`
- **Path:** `/reviews/mine?listingId=:listingId`
- **Response:** `200 OK` with the `Review`, or `404` when the user has not reviewed the listing yet.

### 4.4 Create review
- **Method:** `POST`
- **Path:** `/reviews`
- **Request Body:**
```json
{
  "listingId": "L-101",
  "rating": 5,
  "tags": ["as_described", "fast_reply"],
  "comment": "Book was exactly as described."
}
```
- **Rules:** the reviewer is the logged-in user, the seller is the listing owner, one review per
  listing per user, and a seller cannot review their own listing.
- **Response:** `201 Created` returns the `Review`.

### 4.5 Update / delete review
- **Methods:** `PATCH /reviews/:id`, `DELETE /reviews/:id`
- **Request Body (PATCH):** `rating`, `tags`, `comment` (all optional)
- **Rules:** only the review author (or an administrator) may change or delete it.
- **Response:** `200 OK` with the updated `Review` or `{ "success": true }`.

### 4.6 Seller profile with rating statistics
- **Method:** `GET`
- **Path:** `/sellers/:sellerId/profile`
- **Response:** `200 OK`
```json
{
  "user": { "id": "4", "name": "Client seller", "avatarUrl": null, "faculty": null },
  "stats": {
    "reviewCount": 1,
    "averageRating": 5.0,
    "distribution": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 1 },
    "topTags": ["as_described", "fast_reply"],
    "badges": ["new_seller"]
  },
  "activeListingsCount": 1,
  "soldCount": 0
}
```

Badges use the same rules as the frontend: fewer than 3 reviews → `new_seller`; otherwise
`trusted_seller` (average ≥ 4.5), `fast_responder` (3+ `fast_reply`) and
`honest_listings` (3+ `as_described`).
