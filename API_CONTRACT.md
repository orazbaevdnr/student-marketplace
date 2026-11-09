# Student Marketplace — API Contract

This document defines the REST API contract matching `src/api/types.ts` and `src/api/restAdapter.ts`. Backend teammates should implement these endpoints to achieve 100% plug-and-play compatibility with the frontend by setting `VITE_USE_MOCK=false`.

Base URL: `http://localhost:8000/api` (configurable via `VITE_API_BASE_URL`).

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
"active" | "sold"
```

### User Object
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
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
  "sellerId": "user_123",
  "seller": {
    "id": "user_123",
    "name": "Alex Morgan",
    "avatarUrl": "https://example.com/avatar.jpg",
    "faculty": "Computer Science"
  },
  "contact": "@alex_m_cs",
  "createdAt": "2026-11-01T10:15:00.000Z"
}
```

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
- **Request Body:**
```json
{
  "title": "Calculus Early Transcendentals 14th Ed",
  "description": "Mint condition, used for Calc 1",
  "price": 40,
  "category": "textbooks",
  "condition": "like_new",
  "images": ["data:image/jpeg;base64,..."],
  "contact": "@student_handle",
  "sellerId": "user_demo",
  "seller": {
    "id": "user_demo",
    "name": "Demo Student",
    "avatarUrl": "https://...",
    "faculty": "Software Engineering"
  }
}
```
- **Response:** `201 Created` returns the created `Listing` object with generated `id`, `status: "active"`, and `createdAt` timestamp.

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
