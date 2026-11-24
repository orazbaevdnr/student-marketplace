# Student Marketplace — Security Testing Report

**Uali Nurlybek | Basic of Information Systems | 23 November 2026**

I reviewed the supplied Student Marketplace source archive against 20 planned security scenarios. The source review identified a high-severity configuration issue involving predictable default credentials and secrets. The configuration was changed in the working copy. Runtime execution and retesting remain pending.

## Work completed and method
Inspected Spring Boot security configuration, JWT service/filter, login rate limiter, listing ownership checks, photo upload/storage logic, multipart limits, CORS, production profile and existing backend tests. The 20 scenarios cover authentication, authorization, ownership/IDOR, hidden listings, uploads, path traversal, brute-force protection, CORS, SQL injection, configuration secrets and production error disclosure.

Java 21 and Node.js 22 were available, but Maven was not installed. No live backend/database/HTTP environment was available. **Pass means confirmed by source-code review only, not a live attack request.** Three configuration checks failed against the original defaults and were fixed in the working copy; runtime retest is pending.

## Finding SEC-01 — High
Original `application.yml` used fallback values `DB_PASSWORD:admin`, a predictable JWT secret, and `ADMIN_PASSWORD:Admin12345!`. If deployment variables were omitted, known credentials or a predictable JWT signing key could be used.

**Fix:** DB password and JWT secret now require environment variables. Admin password defaults to empty, so bootstrap skips admin creation unless explicitly configured. `JwtService` already enforces a 32-byte minimum secret. Runtime startup and login retests remain pending.

## Results
See `test_results.csv` for the 20 cases, steps, expected outcomes and observations. See `defects.md` and `security-fix.patch` for the defect and source change.

## Limits and next steps
This report applies to the supplied archive, not a later deployment. Run Maven tests with a disposable database, execute all 20 scenarios against the running application, capture HTTP evidence/screenshots, and retest SEC-01 with and without required environment variables.
