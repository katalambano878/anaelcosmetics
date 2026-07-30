# ANAEL Cosmetics — Full System Audit

**Project:** `anaelcosmetics`  
**Branch:** `staging/plain-postgres`  
**Staging URL:** https://anaelcosmetics-staging.169-58-8-203.sslip.io  
**Audit date:** 2026-07-30

---

## Baseline Before Repair

| Item | State |
|------|--------|
| Branch | `staging/plain-postgres` |
| Staging health | App responding at staging URL |
| Staging DB | ~75 orders in `store_anaelcosmetics` |
| Local dev | `next` package broken locally; no `.env` present |
| Critical exposure | Open `GET /rest/v1/orders` returned all orders including customer emails (confirmed on staging **before** ACL deploy) |
| Payment gateways | Moolre only — Hubtel and Paystack **not implemented** |

---

## Architecture

```
Browser (supabase-js)
    │
    ├─► /auth/v1/*     → lib/db/auth.ts (JWT sessions, bcrypt passwords)
    ├─► /rest/v1/*     → lib/db/supabase-compat.ts → pg Pool (when DATABASE_URL set)
    └─► /storage/v1/*  → lib/db/storage.ts (local disk + HMAC signed URLs)

Server (API routes, cron, middleware)
    └─► supabaseAdmin → plain-PG compat client OR hosted Supabase service role
```

**Stack:** Next.js 15 (`next@^15.1.11`), React 19, `@supabase/supabase-js@^2.91.1`, `pg@^8.18.0`, `jose` (JWT).

**Mode detection:** `lib/db/mode.ts` — plain Postgres active when `DATABASE_URL` or `POSTGRES_URL` is set.

**Browser client:** `lib/supabase.ts` — in plain-PG mode, `NEXT_PUBLIC_SUPABASE_URL` must point at **this app's origin** so supabase-js hits local shims instead of hosted Supabase.

**Admin client:** `lib/supabase-admin.ts` — uses in-process pg compat when plain Postgres; otherwise hosted Supabase service-role client.

---

## Route Inventory (54 pages under `app/`)

### Storefront — 33 pages

| Path | Purpose |
|------|---------|
| `/` | Home |
| `/shop` | Product listing |
| `/categories` | Category browse |
| `/product/[slug]` | Product detail |
| `/cart` | Shopping cart |
| `/checkout` | Checkout (WhatsApp primary) |
| `/pay/[orderId]` | Pay page (Moolre link) |
| `/order-success` | Post-payment confirmation |
| `/order-tracking` | Guest order lookup |
| `/wishlist` | Saved items |
| `/about`, `/contact`, `/faqs` | Content |
| `/blog`, `/blog/[id]` | Blog |
| `/shipping`, `/returns`, `/returns/confirmation` | Policies |
| `/privacy`, `/terms` | Legal |
| `/help`, `/help/article/[id]` | Help center |
| `/support/ticket`, `/support/tickets` | Support |
| `/auth/login`, `/auth/signup`, `/auth/forgot-password` | Auth |
| `/account`, `/account/privacy`, `/account/verify-email`, `/account/verify-phone` | Account |
| `/offline`, `/maintenance`, `/pwa-settings` | Utility |

### Admin — 21 pages

| Path | Purpose |
|------|---------|
| `/admin` | Dashboard |
| `/admin/login` | Staff login |
| `/admin/orders`, `/admin/orders/[id]` | Order management |
| `/admin/products`, `/admin/products/new`, `/admin/products/[id]` | Catalog |
| `/admin/categories`, `/admin/inventory` | Catalog ops |
| `/admin/customers`, `/admin/customers/[id]`, `/admin/customer-insights` | CRM |
| `/admin/coupons`, `/admin/reviews`, `/admin/blog` | Marketing |
| `/admin/analytics`, `/admin/notifications` | Reporting & campaigns |
| `/admin/pos` | Point of sale |
| `/admin/modules` | Feature toggles |
| `/admin/test-sms` | SMS testing |

### API & shim routes (not counted in 54 pages)

| Route | Purpose |
|-------|---------|
| `/api/health` | Public health check |
| `/api/storefront/checkout` | Server-side checkout (DB-priced) |
| `/api/storefront/orders/lookup` | Guest-safe order lookup |
| `/api/storefront/products`, `/api/storefront/categories` | Storefront data |
| `/api/payment/moolre`, `/callback`, `/verify` | Moolre payment flow |
| `/api/cron/payment-reminders` | Unpaid order reminders |
| `/api/notifications`, `/api/recaptcha/verify` | Notifications, captcha |
| `/auth/v1/*`, `/rest/v1/*`, `/storage/v1/*` | Supabase-compat shims |

---

## Critical Findings and Fixes

| Finding | Severity | Fix |
|---------|----------|-----|
| Open `GET /rest/v1/orders` exposed all customer emails | **Critical** | `lib/db/rest-acl.ts` + `lib/db/rest-auth.ts` — default-deny REST ACL; orders readable only by owner (`user_id`) or staff/service role |
| Client-trusted checkout totals / prices | **High** | `app/api/storefront/checkout/route.ts` — recalculates from DB prices and stock |
| Client-trusted payment amounts | **High** | `app/api/payment/moolre/route.ts` — amount always from DB `orders.total` |
| Forged payment success via redirect flag | **High** | `app/api/payment/moolre/verify/route.ts` — only trusts Moolre API status |
| Callback without secret in production | **High** | Callback rejects when `MOOLRE_CALLBACK_SECRET` missing in production |
| Callback amount mismatch accepted | **High** | Callback and verify reject if paid amount ≠ order total (±0.01) |
| Double stock reduction on re-callback | **Medium** | `mark_order_paid` idempotent migration + `stock_reduced` metadata guard |
| Duplicate confirmation emails/SMS | **Medium** | `confirmation_sent` metadata flag in callback and verify |
| Guest order pages hit open REST | **High** | `app/api/storefront/orders/lookup/route.ts` — email-gated track mode, masked success mode |
| Storage uploads open to anon | **High** | `authorizeStorageWrite` — admin/staff/service role only |
| Hung Moolre/SMS fetches freeze handlers | **Medium** | `lib/fetch-timeout.ts` (15–20 s) on payment and SMS calls |
| Admin middleware relied on hosted Supabase | **Medium** | `middleware.ts` — JWT verify via `AUTH_JWT_SECRET` in plain-PG mode |
| No local env template | **Low** | `.env.example` added |
| No health endpoint | **Low** | `/api/health` added |

---

## Payments: Moolre Only

| Gateway | Status |
|---------|--------|
| **Moolre** | Implemented — initiation, callback, verify, SMS |
| **Hubtel** | Not implemented (no code, no env vars) |
| **Paystack** | Not implemented (no code, no env vars) |

**Current checkout UX:** Moolre is disabled in the checkout UI; orders default to **WhatsApp** placement (`paymentMethod: 'whatsapp'`). Moolre routes remain for admin payment links, cron reminders, and `/pay/[orderId]`.

---

## Remaining Risks / Manual Actions

1. **Deploy repair branch to staging** — ACL and lookup routes exist in code but staging still runs pre-ACL build until redeployed. Re-verify that open `/rest/v1/orders` is blocked after deploy.
2. **Apply DB migration** — run `node scripts/apply-mark-order-paid.mjs` (or `supabase db push`) for idempotent `mark_order_paid`.
3. **Set production secrets** — `AUTH_JWT_SECRET`, `MOOLRE_CALLBACK_SECRET`, `CRON_SECRET`, `STORAGE_SIGNING_SECRET`, Moolre API keys, Resend key.
4. **Configure env on VPS** — copy `.env.example` → deploy env; set `DATABASE_URL`, `STORAGE_ROOT`, `NEXT_PUBLIC_APP_URL`.
5. **Admin dashboard pagination** — `/admin` and `/admin/orders` fetch all orders client-side; will degrade as order count grows (see `PERFORMANCE_REPORT.md`).
6. **Local dev** — restore working `node_modules` / fix broken `next` package; copy `.env.example` to `.env.local` for local testing.
7. **WhatsApp checkout** — orders created as pending; manual payment confirmation by staff (no auto-pay on WhatsApp path).
8. **Cron job** — schedule `GET /api/cron/payment-reminders` with `Authorization: Bearer $CRON_SECRET`.

---

## Verification Checklist (post-deploy)

- [ ] `GET /api/health` returns `ok: true`, `mode: plain_postgres`, `database: ok`
- [ ] `GET /rest/v1/orders` as anon returns 403
- [ ] Order tracking requires matching email via `/api/storefront/orders/lookup`
- [ ] Moolre callback rejects wrong secret and amount mismatch
- [ ] Storage upload without staff JWT returns 403
