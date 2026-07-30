# ANAEL Cosmetics — Performance Report

**Scope:** Admin freezing, API timeouts, REST abuse mitigation, and remaining recommendations.

---

## Observed Freezing Causes

### 1. Unpaginated client-side queries

Several admin pages fetch entire tables through supabase-js with no `limit`:

| Page | Query | Impact |
|------|-------|--------|
| `/admin/orders` | All orders + embedded `order_items` | Grows linearly with order count (~75 today) |
| `/admin` (dashboard) | All orders for revenue/stats | Full table scan on every dashboard load |
| `/admin/notifications` | All customers (email, phone) | Large recipient list in browser memory |
| `/admin/customers` | `select('*')` unpaginated | Degrades with CRM growth |

These block the main thread while parsing large JSON responses and re-rendering lists.

### 2. Hung external fetches

Payment and notification code called Moolre and SMS APIs without timeouts. A slow or unresponsive upstream could hold the Node request handler open indefinitely, causing:

- Stalled payment initiation responses
- Frozen callback/verify handlers under load
- SMS sends blocking notification batch paths

---

## Fixes Applied

### Fetch timeouts — `lib/fetch-timeout.ts`

| Caller | Timeout | Endpoint |
|--------|---------|----------|
| Moolre payment initiation | 20s | `api.moolre.com/embed/link` |
| Moolre verify | 15s | `api.moolre.com/open/transact/status` |
| Moolre SMS | 15s | `api.moolre.com/open/sms/send` |

On timeout, payment routes return 504 with a user-facing retry message.

### REST ACL — abuse and data exposure

`lib/db/rest-acl.ts` + `lib/db/rest-auth.ts`:

- Blocks anonymous bulk reads of `orders`, `customers`, `order_items`
- Prevents storage uploads without staff credentials
- Reduces scraper-driven DB load from open PostgREST-shaped endpoints

**Note:** ACL is in codebase but **staging still needs deploy** for these protections to be live.

### Cron batch limit

`app/api/cron/payment-reminders/route.ts` processes max **50** unpaid orders per invocation to avoid long-running cron requests.

### Server-side checkout

`app/api/storefront/checkout/route.ts` consolidates cart validation server-side (max 50 items), reducing malformed client retry storms.

---

## Remaining Recommendations

### High priority — admin pagination

| Page | Recommendation |
|------|----------------|
| `/admin/orders` | Server-side pagination (25–50 per page), defer `order_items` to detail view |
| `/admin` dashboard | Aggregate queries in API route (`COUNT`, `SUM` by date) instead of fetching all orders |
| `/admin/notifications` | Paginate customer fetch or move recipient build to `/api/notifications` |
| `/admin/customers` | Add `.range()` pagination and search |

### Medium priority

- Add default `limit` cap in REST shim for anon GET requests (e.g. max 100 rows unless staff)
- Index review: ensure `orders.created_at`, `orders.payment_status`, `orders.user_id` indexed
- Consider React Query or SWR with stale-while-revalidate for admin lists

### Low priority

- Lazy-load `ProductSalesStats` on orders page (already toggleable)
- Compress admin chart data server-side (7-day window only needs 7 aggregates)

---

## Health Monitoring

`GET /api/health` returns:

```json
{
  "ok": true,
  "checks": {
    "app": "ok",
    "mode": "plain_postgres",
    "database": "ok",
    "payment_moolre": "configured",
    "callback_secret": "configured"
  }
}
```

Use for uptime checks; does not expose secrets or measure query latency.

---

## What Was Not Tested

No load tests or Lighthouse benchmarks were run as part of this repair. Performance improvements are based on code review and known failure modes, not measured before/after metrics.
