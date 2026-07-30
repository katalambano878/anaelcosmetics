# ANAEL Cosmetics — Repair Changelog

Changes from the 2026-07-30 security and plain-Postgres repair pass.

---

## Added

| File | Purpose |
|------|---------|
| `lib/db/rest-auth.ts` | Resolve REST/storage caller identity from apikey and JWT |
| `lib/db/rest-acl.ts` | Application-level ACL replacing Supabase RLS for HTTP shims |
| `lib/fetch-timeout.ts` | AbortController wrapper for Moolre/SMS fetches |
| `app/api/storefront/orders/lookup/route.ts` | Guest-safe order lookup (track / pay / success modes) |
| `app/api/storefront/checkout/route.ts` | Server-side checkout with DB price validation |
| `app/api/health/route.ts` | Public health check (no secrets) |
| `supabase/migrations/20260730000000_mark_order_paid_idempotent.sql` | Idempotent payment RPC + stock guard |
| `.env.example` | Environment template (no real secrets) |
| `scripts/apply-mark-order-paid.mjs` | Apply payment migration to `DATABASE_URL` |
| `docs/SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md` | Project cutover playbook |
| `FULL_SYSTEM_AUDIT.md` | System audit summary |
| `SUPABASE_TO_POSTGRES_MIGRATION_REPORT.md` | Migration feature matrix |
| `PAYMENT_AND_CALLBACK_AUDIT.md` | Moolre payment audit |
| `PERFORMANCE_REPORT.md` | Performance findings and fixes |
| `REPAIR_CHANGELOG.md` | This file |

---

## Updated

| File | Changes |
|------|---------|
| `middleware.ts` | Plain-PG JWT admin auth; cache headers for API/shim routes |
| `app/rest/v1/[table]/route.ts` | ACL gate on all table methods; ownership filter injection |
| `app/rest/v1/rpc/[fn]/route.ts` | RPC ACL (public vs staff functions) |
| `app/storage/v1/object/[bucket]/[...path]/route.ts` | Upload auth via `authorizeStorageWrite` |
| `app/api/payment/moolre/callback/route.ts` | Secret enforcement, amount validation, idempotent notifications |
| `app/api/payment/moolre/verify/route.ts` | Moolre API-only verification, amount check, fetch timeout |
| `app/api/payment/moolre/route.ts` | DB-sourced amount, external ref persistence, fetch timeout |
| `lib/notifications.ts` | SMS fetch timeout via `fetchWithTimeout` |
| `app/api/cron/payment-reminders/route.ts` | Cron secret required; batch limit 50 |
| `app/(store)/checkout/page.tsx` | WhatsApp default checkout; server checkout API |
| `app/(store)/pay/[orderId]/page.tsx` | Order lookup API instead of open REST |
| `app/(store)/order-tracking/page.tsx` | Email-gated lookup API |
| `app/(store)/order-success/page.tsx` | Lookup API + verify flow |
| `app/sitemap.ts` | Plain-PG aware DB client selection |
| `lib/supabase.ts` | Document shim URL requirement for plain-PG mode |
| `lib/db/mode.ts` | `isPlainPostgres()`, `authJwtSecret()` with production guard |

---

## Database

Run on staging/production after deploy:

```bash
node scripts/apply-mark-order-paid.mjs
```

Requires `DATABASE_URL` in environment.

---

## Deploy Status

- **Code:** on branch `staging/plain-postgres` (local repo)
- **Staging:** https://anaelcosmetics-staging.169-58-8-203.sslip.io — **redeploy required** for REST ACL, lookup routes, and checkout API to take effect
- **Migration:** apply `mark_order_paid` idempotent function manually if not yet run

---

## Intentionally Not Changed

- Hubtel / Paystack integration (not in scope — not implemented)
- Admin dashboard pagination (documented in `PERFORMANCE_REPORT.md` — follow-up)
- Moolre re-enable in checkout UI (WhatsApp remains default)
