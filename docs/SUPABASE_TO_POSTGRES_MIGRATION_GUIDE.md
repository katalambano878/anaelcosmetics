# ANAEL Cosmetics — Supabase → Plain Postgres Cutover Guide

Project-specific playbook for migrating ANAEL from hosted Supabase to plain Postgres on the big VPS (`store_anaelcosmetics`).

---

## Overview

ANAEL uses a **dual-mode** architecture: the same codebase runs against hosted Supabase (legacy) or plain Postgres (target) depending on env vars. The browser still uses `@supabase/supabase-js`; requests are routed to in-app shims that speak PostgREST/GoTrue/Storage protocol over `pg`.

**Branch:** `staging/plain-postgres`  
**Staging:** https://anaelcosmetics-staging.169-58-8-203.sslip.io

---

## Prerequisites

- Postgres database provisioned: `store_anaelcosmetics` on fleet-postgres
- Schema applied from `supabase/migrations/` (start with `20260209000000_complete_schema.sql`)
- File storage directory on VPS (e.g. `/data/anaelcosmetics/storage`)
- Coolify app redeploy access for env updates

---

## Environment Mapping

| Supabase / legacy | Plain Postgres replacement | Notes |
|-------------------|---------------------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` (hosted) | Same var → **app origin** | e.g. `https://anaelcosmetics-staging.169-58-8-203.sslip.io` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Any non-empty string | Used by ACL to recognize anon clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Strong random string | Bypasses REST ACL for server jobs |
| Supabase Postgres connection | `DATABASE_URL` | `postgresql://app_user@host:5432/store_anaelcosmetics` |
| Supabase Auth JWT secret | `AUTH_JWT_SECRET` | Required in production (`lib/db/mode.ts`) |
| Supabase Storage buckets | `STORAGE_ROOT` + `STORAGE_PUBLIC_URL` | Local disk via `lib/db/storage.ts` |
| Signed URL secret | `STORAGE_SIGNING_SECRET` | HMAC for private objects |
| — | `NEXT_PUBLIC_USE_PLAIN_PG=true` | Enables plain-PG middleware path |
| — | `NEXT_PUBLIC_APP_URL` | Callbacks, emails, storage public URLs |

See `.env.example` for the full template (no real secrets).

---

## Shim Architecture

### 1. REST (`/rest/v1/[table]`, `/rest/v1/rpc/[fn]`)

- **Implementation:** `lib/db/supabase-compat.ts` + route handlers under `app/rest/v1/`
- **Database:** `pg` Pool from `lib/db/pool.ts` when `DATABASE_URL` set
- **ACL:** `lib/db/rest-acl.ts` replaces Supabase RLS for HTTP access
- **Auth resolution:** `lib/db/rest-auth.ts` — parses `apikey` / Bearer JWT, maps to anon / authenticated / staff / service_role

**Important:** In-process `supabaseAdmin` bypasses REST ACL (same as Supabase service role). ACL only protects HTTP shim endpoints.

### 2. Auth (`/auth/v1/*`)

- **Implementation:** `app/auth/v1/[...path]/route.ts` + `lib/db/auth.ts`
- **Passwords:** bcrypt in `auth.users` equivalent table
- **Tokens:** JWT signed with `AUTH_JWT_SECRET` via `jose`
- **Roles:** `app_metadata.role` = `admin` | `staff` for middleware and ACL staff bypass

### 3. Storage (`/storage/v1/object/*`)

- **Implementation:** `lib/db/storage.ts` + routes under `app/storage/v1/`
- **Public objects:** `/storage/v1/object/public/{bucket}/{path}`
- **Private objects:** HMAC-signed URLs via `/storage/v1/object/sign/...`
- **Uploads:** POST requires staff/admin/service_role (`authorizeStorageWrite`)

### 4. Server admin client

```typescript
// lib/supabase-admin.ts
isPlainPostgres() ? createPgClient() : createSupabaseJsClient(url, serviceKey)
```

Use only in API routes and server actions — never in client components.

---

## ACL Summary (replaces RLS)

| Actor | GET orders | GET customers | INSERT orders | Storage upload |
|-------|-----------|---------------|---------------|----------------|
| anon | Deny (list) | Deny | Allow (checkout) | Deny |
| authenticated | Own (`user_id`) | Deny | Allow | Deny |
| staff / admin | Allow | Allow | Allow | Allow |
| service_role | Allow | Allow | Allow | Allow |

Public read tables: `products`, `categories`, `product_images`, `product_variants`, `banners`, `reviews`, `blog_posts`, `coupons`, etc. (see `PUBLIC_READ` in `lib/db/rest-acl.ts`).

Guest order access: use `/api/storefront/orders/lookup` — **not** direct REST.

---

## Cutover Steps

### Phase 1 — Staging (current)

1. Provision `store_anaelcosmetics` and restore/import data (~75 orders baseline).
2. Set env vars per `.env.example` on Coolify staging app.
3. Deploy `staging/plain-postgres` branch.
4. Apply idempotent payment migration:
   ```bash
   node scripts/apply-mark-order-paid.mjs
   ```
5. Verify `/api/health`, REST ACL, checkout, Moolre callback URL reachable from Moolre.

### Phase 2 — Production

1. Snapshot hosted Supabase DB and storage assets.
2. Restore to `store_anaelcosmetics` prod DB (or separate `store_anaelcosmetics_prod`).
3. Copy uploaded images to `STORAGE_ROOT`.
4. Update production env: `DATABASE_URL`, shim URLs, secrets.
5. Point domain DNS to VPS app.
6. Remove hosted Supabase env vars once verified.

### Phase 3 — Cleanup

- Confirm zero `@supabase/supabase-js` calls to hosted project URL in network tab
- Remove unused Supabase project credentials from deploy config
- Keep `supabase/migrations/` as schema source of truth

---

## Auth JWT Notes

- Cookie names: `sb-access-token` or `sb-{ref}-auth-token` (middleware parses both)
- Admin routes: middleware verifies JWT and checks `app_metadata.role` in plain-PG mode
- Create admin user: `node scripts/create-admin-user.mjs` (requires `DATABASE_URL`)

---

## Storage on Disk

```
STORAGE_ROOT/
  product-images/
  banners/
  ...
```

- Public bucket files served without signature
- Private buckets use `createSignedUrl()` — same supabase-js API, backed by HMAC
- Set `STORAGE_PUBLIC_URL` to CDN or app origin for correct URLs in emails/admin

---

## Rollback

If cutover fails:

1. Revert `NEXT_PUBLIC_SUPABASE_URL` to hosted Supabase project URL
2. Unset `DATABASE_URL` / `NEXT_PUBLIC_USE_PLAIN_PG`
3. Redeploy previous commit
4. Hosted Supabase RLS policies remain authoritative until cutover is re-attempted

---

## Verification

| Check | Expected |
|-------|----------|
| `GET /api/health` | `mode: plain_postgres`, `database: ok` |
| Anon `GET /rest/v1/orders` | 403 |
| Anon `GET /rest/v1/products` | 200 |
| Login at `/admin/login` | JWT cookie set, dashboard loads |
| Checkout | Order created via `/api/storefront/checkout` |
| Image upload in admin | 200 with staff session |
| Moolre callback | `mark_order_paid` idempotent, stock reduced once |

**Note:** Staging still needs deploy of latest code for REST ACL to take effect on the live URL.
