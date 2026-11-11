# Security review

Date: 2026-11-10
Scope: React frontend (`BIS/`), Spring Boot backend (`student-marketplace/`), and the new
Docker/Nginx deployment bundle (`BIS/deploy/`).

Method: manual code review of the authentication, authorization, file upload, error handling
and configuration paths; dependency audits (`npm audit`, Maven, OWASP dependency-check);
review of the production container configuration. No external penetration test was performed.

## 1. Summary

| Area | Before | After |
|---|---|---|
| Frontend dependencies | 8 advisories (5 high, 3 moderate) | 0 (`npm audit`) |
| Backend framework | Spring Boot 3.3.5 | Spring Boot 3.5.16 |
| Security headers | Spring defaults only | CSP, HSTS, frame-deny, nosniff, Referrer-Policy, Permissions-Policy in Spring **and** Nginx |
| Brute force on login/register | none | in-memory limiter in the backend + `limit_req` in Nginx |
| Production profile | none | `application-prod.yml`: no Swagger, health-only Actuator, no stack traces |
| Container hardening | backend non-root | non-root, `no-new-privileges`, only 80/443 published, internal network |
| Secrets | `.env` ignored | `.env.prod` ignored, generated with a script, never baked into images |

`mvn verify`: 20 tests, BUILD SUCCESS. `npx tsc --noEmit` and `npm run build`: clean.

## 2. Dependency vulnerabilities

### Frontend

`npm audit` reported 8 advisories (5 high, 3 moderate) before the upgrade.

| Package | Issue | Action |
|---|---|---|
| `@grpc/grpc-js` < 1.13.6 | GHSA-m9gg-hp2v-232j (auth context accepts unauthorized certificates), GHSA-f596-whhp-79r4 | npm `overrides` → `^1.13.6` |
| `firebase` / `@firebase/firestore` | transitive `@grpc/grpc-js` advisory | fixed by the override (no breaking Firebase downgrade) |
| `react-router` / `react-router-dom` 6.x | moderate advisory | upgraded to `7.18.5` |
| `vite` 5.x / `esbuild` <= 0.24.2 | GHSA-67mh-4wv8-2f99 (dev server can be queried by any website) | upgraded to `vite 7.3.8`, `@vitejs/plugin-react 5.2.0` |

Result after `npm install`: **0 vulnerabilities**.

The esbuild advisory only affects `vite dev` / `vite preview`, not the static production
build, but the upgrade removes it completely.

### Backend

| Package | Before | After |
|---|---|---|
| Spring Boot | 3.3.5 | 3.5.16 |
| `jjwt` | 0.12.6 | 0.12.7 |
| `springdoc-openapi` | 2.6.0 | 2.8.17 |

Spring Boot 3.3.x is out of open-source support; 3.5.x receives security patches. The upgrade
required no source changes; the full test suite passes.

`org.sonatype.ossindex.maven:ossindex-maven-plugin` cannot be used: the service answers
HTTP 401 without an account. `org.owasp:dependency-check-maven:12.2.2` was started, but its
first run has to download the whole NVD feed (421k records). **Without an NVD API key this
takes hours and was not finished during this review.** This is an open action item:

```bash
# one-time, then the scan is fast
mvn org.owasp:dependency-check-maven:12.2.2:check \
  -DnvdApiKey=<key> -DfailBuildOnCVSS=7
```

Until then, treat the backend dependency tree as "reviewed by version, not by CVE feed".

## 3. Findings and fixes

### F-1 (High) — Vulnerable frontend dependencies
Fixed by upgrading React Router, Vite and overriding `@grpc/grpc-js`; `npm audit` is clean.

### F-2 (High) — Backend on an unsupported Spring Boot line
Fixed by moving to 3.5.16.

### F-3 (Medium) — No protection against password brute force
`/api/auth/login` and `/api/auth/register` accepted unlimited requests.
Fixed with `RateLimitFilter` (10 requests / 60 s per client IP, configurable via
`RATE_LIMIT_*`) and an Nginx `limit_req` zone (10 requests / minute, burst 5). The filter is
unit-tested (`RateLimitFilterTest`).

### F-4 (Medium) — Missing browser security headers
Added by Spring Security (`SecurityConfig`) and by Nginx (`deploy/nginx/default.conf`):
`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
`Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`,
`Cross-Origin-Resource-Policy`. HSTS is sent by the HTTPS Nginx config.

CSP notes: `script-src 'self'` works because the Vite build emits no inline scripts;
Firebase Auth needs `connect-src` to `*.googleapis.com` / `*.firebaseapp.com` and
`frame-src` for the Google popup; `img-src https:` is required by the placeholder images
(`picsum.photos`, Unsplash).

### F-5 (Medium) — Production leaked developer endpoints and stack traces
`application-prod.yml` disables Swagger/OpenAPI, exposes only `/actuator/health` with
`show-details: never`, and disables message/stacktrace/binding-error output.

### F-6 (Medium) — Deployment exposed the backend and database directly
The new compose file publishes only the frontend (80/443). PostgreSQL and the backend are on
an internal Docker network with no published ports. Containers run with
`no-new-privileges`; the backend image runs as UID 10001.

### F-7 (Low) — No container health checks / fragile startup order
Backend and frontend images now have `HEALTHCHECK`s; compose waits for `db` and `backend`
to be healthy before starting dependants.

### F-8 (Low) — Secrets could be committed accidentally
`deploy/.env.prod`, `deploy/backups/` and `deploy/nginx/certs/` are ignored. The example file
contains placeholders only. `deploy/scripts/generate-secrets.ps1` generates URL-safe random
values and refuses to overwrite an existing file.

### F-9 (Low) — Default Spring Security user was created at startup
Spring Boot's `UserDetailsServiceAutoConfiguration` created an in-memory `user` with a random
password and logged it. The application only uses JWT/Firebase tokens, so the account was not
reachable through any enabled login mechanism, but it is unnecessary surface and log noise.
Excluded the auto-configuration in `MarketplaceApplication`.

## 4. Controls verified as already correct

- **Password storage**: BCrypt (`BCryptPasswordEncoder`), password length 8–72, e-mail
  normalized; unknown e-mail is compared against a dummy hash so the response time does not
  reveal whether an account exists, and the error message is generic.
- **JWT**: HMAC-SHA, expiry (`JWT_TTL_MINUTES`), subject/email/role claims; the secret must be
  at least 32 bytes or the application refuses to start.
- **Firebase tokens**: RS256 signature with Google keys, issuer and audience checked against
  `FIREBASE_PROJECT_ID`, `email_verified` required in production, optional
  `ALLOWED_EMAIL_DOMAIN` restriction.
- **Authorization / IDOR**: listing update, delete, photo changes and profile changes check
  the owner in the service layer (`ForbiddenException`), not only in the UI.
- **Admin area**: both `/api/admin/**` URL rule and `@PreAuthorize("hasRole('ADMIN')")`.
- **File uploads**: magic-byte detection (JPEG/PNG/WebP only), generated UUID file names,
  `root.resolve(...).normalize()` + `startsWith(root)` path-traversal guard, 5 MB per file /
  6 MB per request limits, max 5 photos per listing.
- **CSRF**: not applicable — stateless bearer tokens, no cookies, no sessions.
- **CORS**: explicit origin allow-list, limited methods and headers, no credentials.
- **XSS**: no `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function` in the frontend;
  React escapes user content by default.
- **SQL injection**: all access through Spring Data JPA / derived queries; no string-built SQL.
- **Error handling**: RFC 7807 `ProblemDetail`, no stack traces to clients, upload size
  exceeded handled explicitly.

## 5. Residual risks and recommendations

| Risk | Severity | Recommendation |
|---|---|---|
| TLS is not enabled by default (HTTP config ships first) | High if forgotten | Enable `https.conf.example` before opening the site to users; see DEPLOYMENT.md §4 |
| Rate limiter state is per instance and in memory | Low | Fine for one backend replica; use Redis/Bucket4j if you scale horizontally |
| Backend dependency CVEs not fully scanned yet | Medium | Run OWASP dependency-check with an NVD API key, or enable Dependabot/Snyk in CI |
| No malware scan of uploaded images | Low | Magic-byte check + size limits are in place; add ClamAV if the threat model requires it |
| Admin has no MFA | Medium | Restrict admin accounts, use a long generated password, consider Firebase MFA |
| Backups are unencrypted at rest | Medium | Encrypt the backup target or the volume; test restores regularly |
| No WAF / DDoS protection | Low | Put Cloudflare or a provider firewall in front if the site is public |
| `img-src https:` is broad (placeholder images) | Low | Narrow it to the exact image hosts once real uploads replace placeholders |
| Logs contain user e-mails | Low | Set a retention policy; do not ship logs to third parties without review |
| JWT/password login exists next to Firebase login | Low | Keep `VITE_ENABLE_DEMO_LOGIN=false` and `require-verified-email: true` in production |

## 6. Verification commands

```bash
# frontend
cd BIS
npm audit                       # 0 vulnerabilities
npx tsc --noEmit
npm run build

# backend
cd student-marketplace
mvn verify                      # 20 tests, BUILD SUCCESS

# after deployment
curl -I https://<domain>/       # CSP, HSTS, X-Frame-Options, nosniff present
curl -I https://<domain>/api/client/listings
curl --max-time 3 http://<server>:8080/actuator/health   # must be refused
curl https://<domain>/actuator/health                    # must be 404 (Nginx blocks it)
curl https://<domain>/v3/api-docs                        # must be 404 (Nginx blocks it)
```

## 7. Sign-off checklist

- [x] No secrets in the repositories (`git grep` for keys, `.env*` ignored)
- [x] Frontend and backend dependency upgrades applied, builds and tests pass
- [x] Security headers in Spring Security and Nginx
- [x] Rate limiting on password endpoints
- [x] Production profile disables Swagger and detailed Actuator
- [x] Containers run as non-root with `no-new-privileges`, only 80/443 published
- [x] Backups configured (database daily, photos via script)
- [ ] TLS certificates installed and HTTPS config enabled (operator action)
- [ ] OWASP dependency-check completed with an NVD API key (operator action)
- [ ] Restore from backup tested on staging (operator action)
