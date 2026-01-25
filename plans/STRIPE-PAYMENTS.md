# Stripe Payments Integration

> Status: IN USE — wiring up Stripe end-to-end for web

## Goal

Complete Stripe integration for web with:
- Free tier: $0/month (no Stripe involvement)
- Pro tier: 7-day free trial → converts to paid subscription
- Testing mode: $0 price to validate full flow before charging real money

## Current State

- ✅ `create-checkout-session` edge function deployed
- ✅ Pricing UI complete (web + iOS)
- ✅ DB has `subscription_tier`, `subscription_status`, `trial_ends_at`
- ❌ No Stripe credentials configured
- ❌ No webhooks to handle subscription lifecycle
- ❌ No `stripe_customer_id` stored
- ❌ No billing enforcement when trial expires

---

## Implementation Plan

### Phase 1: Stripe Dashboard Setup (Manual)

- [ ] Create Stripe account (if not done) or use existing
- [ ] Create Product: "Vault Pro"
- [ ] Create Price: $0/month recurring (test mode) with Price ID
- [ ] Note the Price ID (starts with `price_`)
- [ ] Create webhook endpoint pointing to our edge function URL

### Phase 2: Environment & Secrets

- [ ] Set `STRIPE_SECRET_KEY` in Supabase secrets
- [ ] Set `VITE_STRIPE_PRICE_ID` in `.env`
- [ ] Set `STRIPE_WEBHOOK_SECRET` in Supabase secrets (for webhook verification)

### Phase 3: Database Migration

- [ ] Add `stripe_customer_id` column to `profiles` table

### Phase 4: Update create-checkout-session

- [ ] Add 7-day trial period to checkout session
- [ ] Create/retrieve Stripe customer and link to user
- [ ] Store `stripe_customer_id` in profiles

### Phase 5: Webhook Edge Function (NEW)

Create `stripe-webhook` edge function to handle:
- [ ] `checkout.session.completed` → set subscription to trial, store customer ID
- [ ] `customer.subscription.updated` → sync status changes
- [ ] `customer.subscription.deleted` → set status to cancelled
- [ ] `invoice.payment_succeeded` → confirm subscription active
- [ ] `invoice.payment_failed` → handle payment failure (notify user)

### Phase 6: Billing Enforcement

- [ ] Update `useAuthGuard` to check trial expiration
- [ ] Show "trial expired" prompt when trial ends without active subscription
- [ ] Define what Free users can't access (scoring, export, etc.)

### Phase 7: Customer Portal (Optional)

- [ ] Add Stripe Customer Portal for billing management
- [ ] Link from Profile page

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `supabase/functions/create-checkout-session/index.ts` | Update with trial + customer creation |
| `supabase/functions/stripe-webhook/index.ts` | **NEW** - webhook handler |
| `supabase/config.toml` | Add stripe-webhook function |
| `supabase/migrations/XXXXX_add_stripe_customer_id.sql` | **NEW** - add column |
| `apps/web/src/pages/Pricing.tsx` | Minor updates if needed |
| `shared/hooks/useAuthGuard.js` | Add trial expiration check |
| `.env` | Add `VITE_STRIPE_PRICE_ID` |

---

## Testing Flow

1. User selects Pro → redirected to Stripe Checkout (with $0 price)
2. User completes checkout → webhook fires `checkout.session.completed`
3. Webhook sets `subscription_status: trial`, `trial_ends_at: +7 days`
4. After 7 days, Stripe charges $0 → webhook fires `invoice.payment_succeeded`
5. Webhook sets `subscription_status: active`
6. When ready: Update Stripe Price to $9/month (no code changes needed)

---

## Questions to Resolve

1. When trial expires and user hasn't paid, what happens?
   - Option A: Downgrade to Free automatically
   - Option B: Show "upgrade" prompt but allow limited access
   - Option C: Block Pro features entirely

2. Should we store subscription metadata (plan start date, billing cycle)?

---

## Session Progress

- [x] Explored existing code
- [x] Created plan
- [ ] Phase 1: Stripe Dashboard setup (YOU - manual)
- [ ] Phase 2: Environment config (YOU - set secrets)
- [x] Phase 3: DB migration (`20260124000001_add_stripe_ids.sql`)
- [x] Phase 4: Update checkout function (7-day trial + customer creation)
- [x] Phase 5: Webhook function (`stripe-webhook`)
- [x] Phase 6: Cancel subscription function (`cancel-subscription`)
- [x] Phase 7: Profile "Switch to Free" UI
- [ ] Phase 8: Deploy migration and functions
- [ ] Phase 9: Test full flow with $0 price
