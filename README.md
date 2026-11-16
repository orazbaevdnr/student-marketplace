# Student Marketplace

A university campus marketplace: students buy and sell textbooks, electronics, dorm essentials,
furniture, clothes and sports gear. Sellers have public profiles with reviews, 🎓 rating badges and
trust statistics.

This repository contains the full-stack project:

```
student-marketplace/        Spring Boot backend (Java 21, PostgreSQL, Flyway, JWT)
student-marketplace-main/   React + Vite frontend (TypeScript, Tailwind, React Router v7)
data/photos/                Uploaded listing photos (runtime data, not committed)
```

## How the frontend picks its data source

The frontend is hybrid, so the same code works locally and on GitHub Pages:

| Where it runs | Auth / data | How |
| --- | --- | --- |
| Local development (`npm run dev`) | Real Spring Boot backend with JWT | Vite proxies `/api` to `http://localhost:8080` |
| Docker / production build (`npm run build`) | Real backend on the same origin | `VITE_API_BASE_URL=/api/client`, Nginx proxies `/api` |
| GitHub Pages (`npm run deploy`) | In-browser demo (mock adapter + `localStorage`) | `npm run build:pages` (`--mode pages`); runtime also forces mock on `*.github.io` |

The reviews system (ratings, tags, seller badges, top sellers) is implemented in both modes. The
backend does not expose review endpoints yet: the REST adapter tries `/api/client/reviews` and
falls back to `localStorage` when the endpoint is unavailable.

## Quick start (local, full stack)

### 1. Backend

```bash
cd student-marketplace
mvn spring-boot:run -Dspring-boot.run.profiles=dev   # in PowerShell quote the -D flag
```

Dev profile uses in-memory H2 and seeds an admin account (`admin@kbtu.kz` / `Admin12345!`).
Swagger UI: <http://localhost:8080/swagger-ui.html>. PostgreSQL setup: see
`student-marketplace/README.md`.

### 2. Frontend

```bash
cd student-marketplace-main
npm install
npm run dev
```

Open <http://localhost:5173>. The demo login button signs in without the backend; regular
sign-in/sign-up goes to the Spring Boot API.

## Deploy to GitHub Pages

```bash
cd student-marketplace-main
npm run deploy        # build:pages + publish dist/ to the gh-pages branch
```

Published at <https://orazbaevdnr.github.io/student-marketplace/>. The Pages build uses the mock
adapter, so the site is fully interactive without a server (data is stored per browser).

## Deploy the real stack

Docker Compose + Nginx + HTTPS instructions are in
[`student-marketplace-main/deploy/DEPLOYMENT.md`](student-marketplace-main/deploy/DEPLOYMENT.md).
Security notes and residual risks are in
[`student-marketplace-main/deploy/SECURITY_REVIEW.md`](student-marketplace-main/deploy/SECURITY_REVIEW.md).

## Documentation

- `student-marketplace-main/README.md` — frontend features, scripts and configuration
- `student-marketplace/README.md` — backend architecture, API and database
- `student-marketplace-main/API_CONTRACT.md` — REST contract used by the frontend
- `student-marketplace-main/PROJECT_GUIDE.md` — architecture walkthrough
- `student-marketplace-main/DEMO_SCRIPT.md` — demo/defense scenario
