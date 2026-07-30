# ANAEL Cosmetics — Supabase → Postgres Migration Report

Feature matrix with replacement strategy and current status.

**Branch:** `staging/plain-postgres`  
**Last updated:** 2026-07-30

---

## Summary

| Category | Items | Done | Partial | Not started |
|----------|-------|------|---------|-------------|
| Database | 6 | 5 | 1 | 0 |
| Auth | 5 | 5 | 0 | 0 |
| Storage | 4 | 4 | 0 | 0 |
| Realtime | 1 | 0 | 0 | 1 |
| Edge Functions | 1 | 0 | 0 | 1 (N/A — none used) |
| Client SDK | 3 | 2 | 1 | 0 |
| Security (RLS) | 2 | 2 | 0 | 0 |

---

## Feature Matrix

| Supabase feature | ANAEL usage | Replacement | Status | Notes |
|------------------|-------------|-------------|--------|-------|
| **Postgres DB** | All app data | `pg` Pool + `DATABASE_URL` | ✅ Done | `lib/db/pool.ts`, migrations in `supabase/migrations/` |
| **PostgREST / `.from()`** | Storefront + admin queries | `/rest/v1/*` shim + `supabase-compat` | ✅ Done | Active when `DATABASE_URL` set |
| **RLS policies** | Hosted Supabase only | `lib/db/rest-acl.ts` (HTTP) + server-side admin | ✅ Done | ACL not yet on staging until deploy |
| **Auth (GoTrue)** | Login, signup, sessions | `/auth/v1/*` + `lib/db/auth.ts` | ✅ Done | bcrypt + JWT |
| **Auth admin API** | Admin user lookup | Direct SQL in auth module | ✅ Done | No hosted `auth.admin` calls in runtime |
| **Storage** | Product images, banners | Local disk + `/storage/v1/*` | ✅ Done | `STORAGE_ROOT`, HMAC signed URLs |
| **Realtime subscriptions** | Not used in ANAEL | — | ⬜ N/A | No migration needed |
| **Edge Functions** | Not used | Next.js API routes | ⬜ N/A | Payments/notifications already in `app/api/` |
| **Database RPCs** | `mark_order_paid`, stats, stock | Same functions in Postgres | ✅ Done | Idempotent migration added 2026-07-30 |
| **supabase-js browser client** | Widespread | Unchanged — points at shims | ⚠️ Partial | Requires `NEXT_PUBLIC_SUPABASE_URL` = app origin |
| **supabaseAdmin service role** | API routes, cron | In-process compat client | ✅ Done | `lib/supabase-admin.ts` |
| **Supabase hosted URL** | Pre-cutover staging | Plain Postgres on VPS | ⚠️ Partial | Staging DB migrated; code deploy pending for ACL |

---

## Runtime Import Audit

| Area | `@supabase/supabase-js` | Plain-PG path |
|------|-------------------------|---------------|
| `lib/supabase.ts` (browser) | Yes — targets shims | ✅ |
| `lib/supabase-admin.ts` | Fallback only | ✅ Compat when `DATABASE_URL` set |
| `middleware.ts` | Fallback for hosted mode | ✅ JWT path when plain PG |
| `app/sitemap.ts` | Fallback for hosted mode | ✅ Uses `supabaseAdmin` in plain PG |
| API routes | Via `supabaseAdmin` | ✅ |
| Client pages (`app/(store)/*`, `app/admin/*`) | Browser client | ✅ Hits shims when URL configured |

**Target:** No runtime calls to hosted Supabase project URL after cutover env is set.

---

## Schema & Migrations

| Migration | Purpose | Applied on staging |
|-----------|---------|-------------------|
| `20260209000000_complete_schema.sql` | Base schema | Yes (baseline) |
| `20260730000000_mark_order_paid_idempotent.sql` | Idempotent payment + stock | **Manual** — run `scripts/apply-mark-order-paid.mjs` |

---

## Env Vars: Remove After Cutover

Once plain Postgres is verified in production, remove from deploy config:

- Hosted Supabase project URL (replace with app origin)
- Hosted Supabase anon/service keys (replace with local ACL keys)
- `SUPABASE_JWT_SECRET` (if duplicated — prefer `AUTH_JWT_SECRET`)

**Keep:** Variable names in `.env.example` for shim compatibility (`NEXT_PUBLIC_SUPABASE_*`).

---

## Known Gaps

1. **REST ACL not live on staging** until latest branch is deployed.
2. **Some admin pages** still use browser `supabase.from('orders').select(...)` without pagination — works via staff JWT + ACL but should move to paginated API for scale.
3. **Customer table reads** from admin notifications page require staff session (blocked for anon by ACL).
4. **No automated integration test suite** for shim parity — verification is manual (see migration guide checklist).

---

## Recommended Next Steps

1. Deploy `staging/plain-postgres` to staging Coolify app.
2. Apply `mark_order_paid` migration on staging DB.
3. Re-test open `/rest/v1/orders` → expect 403.
4. Production cutover after 48h stable staging.
5. Decommission hosted Supabase project after backup retention period.
