# ANAEL Cosmetics — Payment & Callback Audit

**Gateway coverage:** Moolre only. Hubtel and Paystack are **not implemented** (no routes, no env vars, no SDK references).

---

## Payment Methods in Production UX

| Method | Checkout UI | API support | Notes |
|--------|-------------|-------------|-------|
| **WhatsApp** | ✅ Default (active) | Order via `/api/storefront/checkout` | Customer redirected to `wa.me` with order summary; payment manual |
| **Moolre** | ❌ Disabled in checkout UI | ✅ Full API | Used via `/pay/[orderId]`, admin "send payment link", cron reminders |

Checkout hardcodes `paymentMethod: 'whatsapp'` (`app/(store)/checkout/page.tsx`). Moolre code paths remain for deferred online payment.

---

## Moolre Flow

```
Customer                    ANAEL App                      Moolre API
    │                           │                              │
    │── POST /api/payment/moolre ──►│                          │
    │   { orderId }               │── embed/link ─────────────►│
    │                           │◄── authorization_url ────────│
    │◄── { url } ─────────────────│                              │
    │── pay on Moolre ─────────────────────────────────────────►│
    │                           │◄── POST /callback ───────────│
    │                           │── mark_order_paid RPC        │
    │── /order-success ─────────►│                              │
    │── POST /verify ───────────►│── transact/status ─────────►│
```

### 1. Initiation — `POST /api/payment/moolre`

**File:** `app/api/payment/moolre/route.ts`

- Rate limited (`RATE_LIMITS.payment`)
- Loads order by UUID or `order_number` from DB — **never trusts client amount**
- Amount = `orders.total` from database
- Generates unique external ref: `{order_number}-R{timestamp}`
- Stores `moolre_external_ref` and `payment_method: 'moolre'` in order metadata
- Calls `https://api.moolre.com/embed/link` with 20s timeout
- Callback URL: `{NEXT_PUBLIC_APP_URL}/api/payment/moolre/callback`
- Redirect URL: `{NEXT_PUBLIC_APP_URL}/order-success?order={ref}&payment_success=true`

**Required env:** `MOOLRE_API_USER`, `MOOLRE_API_PUBKEY`, `MOOLRE_ACCOUNT_NUMBER`, `MOOLRE_MERCHANT_EMAIL`

### 2. Callback — `POST /api/payment/moolre/callback`

**File:** `app/api/payment/moolre/callback/route.ts`

- Accepts JSON, form, or urlencoded body
- **Production:** rejects if `MOOLRE_CALLBACK_SECRET` unset or `body.secret` mismatch (403)
- Parses order ref from `data.externalref` (strips `-R{ts}` suffix)
- Success requires `body.status === 1` AND `data.txtstatus === 1`; explicit `txtstatus === 2` = failure
- **Amount validation:** callback amount must match `orders.total` (±0.01) or 400
- Calls `mark_order_paid(order_ref, moolre_ref)` RPC (idempotent)
- Sends confirmation email/SMS once via `confirmation_sent` metadata flag
- Failed payments set `payment_status: 'failed'` without overwriting paid orders

### 3. Verify — `POST /api/payment/moolre/verify`

**File:** `app/api/payment/moolre/verify/route.ts`

- Called from order-success page as fallback when callback is delayed
- **Does not trust** `payment_success` query param or client redirect flags
- Validates order number format: `ORD-{digits}-{digits}`
- Polls Moolre `https://api.moolre.com/open/transact/status` with refs:
  1. `metadata.moolre_external_ref` (preferred)
  2. Plain `order_number` (legacy)
- Requires Moolre `status === 1` and `txstatus === 1`
- **Amount validation:** same ±0.01 tolerance as callback
- Idempotent notification sending (same `confirmation_sent` guard)

---

## WhatsApp Checkout Path

**File:** `app/(store)/checkout/page.tsx` + `app/api/storefront/checkout/route.ts`

1. Customer completes shipping form (reCAPTCHA optional)
2. `POST /api/storefront/checkout` with cart lines (product IDs + qty only)
3. Server recalculates prices, checks stock, creates order + order_items
4. Default `paymentMethod: 'whatsapp'` → order status pending payment
5. Client builds WhatsApp message with order number, items, total
6. Redirect to `https://wa.me/{NEXT_PUBLIC_WHATSAPP_NUMBER}?text=...`
7. Staff confirms payment manually in admin

**Security:** No client-provided totals; max 50 line items; rate limit 10/min per IP.

---

## Amount Validation Summary

| Path | Amount source | Validation |
|------|---------------|------------|
| Moolre initiation | DB `orders.total` | Client amount ignored |
| Moolre callback | `data.amount` | Must match DB total ±0.01 |
| Moolre verify | Moolre API `data.amount` | Must match DB total ±0.01 |
| WhatsApp checkout | DB product/variant prices | Server-side recalculation |

---

## Idempotency

| Mechanism | Location |
|-----------|----------|
| `mark_order_paid` skips if already paid | `supabase/migrations/20260730000000_mark_order_paid_idempotent.sql` |
| `stock_reduced` metadata prevents double decrement | Same migration |
| Callback returns success if order already paid | `callback/route.ts` |
| Verify returns success if order already paid | `verify/route.ts` |
| `confirmation_sent` prevents duplicate emails/SMS | callback + verify |

---

## Supporting Systems

| Feature | Route / file | Notes |
|---------|--------------|-------|
| Payment reminders | `GET /api/cron/payment-reminders` | Requires `Authorization: Bearer $CRON_SECRET`; max 50 orders/run |
| Payment link email/SMS | `lib/notifications.ts` → `sendPaymentLink` | Uses Moolre initiation internally |
| Order lookup (pay page) | `POST /api/storefront/orders/lookup` mode=`pay` | Returns payment fields without open REST |
| Guest tracking | mode=`track` | Requires order number + email match |

---

## Hubtel / Paystack

| Gateway | Code | Env vars | Status |
|---------|------|----------|--------|
| Hubtel | None | None | **Not implemented** |
| Paystack | None | None | **Not implemented** |

Documented in `.env.example` comment only. Adding either gateway would require new routes, callback handlers, and checkout UI work.

---

## Required Secrets (names only)

```
MOOLRE_API_USER
MOOLRE_API_PUBKEY
MOOLRE_ACCOUNT_NUMBER
MOOLRE_MERCHANT_EMAIL
MOOLRE_CALLBACK_SECRET    # required in production
MOOLRE_SMS_API_KEY        # optional, for SMS notifications
CRON_SECRET               # payment reminder cron
```

---

## Manual Verification (post-deploy)

1. Create test order → initiate Moolre → confirm callback marks paid once
2. Replay callback → confirm idempotent (no double stock reduction)
3. Send callback with wrong amount → expect 400
4. Send callback without secret (production) → expect 403
5. WhatsApp checkout → order created, no Moolre URL generated
