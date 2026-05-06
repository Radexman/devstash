# Stripe Phase 2 — Webhook, Gating, and UI

## Overview

Layer the user-visible billing flow on top of the Phase 1 plumbing: Checkout + Portal server actions, the webhook that keeps `isPro` in sync, free-tier gating in `createItem` / `createCollection`, the Subscription card on `/settings`, the Upgrade buttons, and a session-aware Pricing CTA on the homepage. Verifying this end-to-end **requires the Stripe CLI** for local webhook delivery — there is no realistic way to test the round-trip without it.

Reference: [docs/stripe-integration-plan.md](docs/stripe-integration-plan.md) §§3.1 (last six files), 3.2 (everything except auth/types), 4 (Stripe Dashboard), 5 (testing checklist), 6 (steps 3–8), 7 (caveats).

**Prerequisite:** Phase 1 (`stripe-phase-1-spec.md`) merged. `User.stripePriceId` and `User.stripeCurrentPeriodEnd` exist; `session.user.isPro` is wired; `src/lib/plan-limits.ts` and `src/lib/db/billing.ts` are in place with passing tests.

## Requirements

### Server actions (Checkout + Portal)

Create `src/actions/billing.ts`:

- `createCheckoutSession({ interval })` — `interval` is `'monthly' | 'yearly'`. Auth-checks, validates with Zod, calls `getOrCreateStripeCustomerId`, creates a Stripe Checkout `mode: 'subscription'` session with `success_url=/settings?checkout=success` and `cancel_url=/settings?checkout=cancel`, returns `{ success: true, data: { url } }`. Pass `metadata: { userId }` on both the session and the embedded `subscription_data`.
- `createPortalSession()` — auth-checks, requires `stripeCustomerId`, opens a Billing Portal session with `return_url=/settings`, returns `{ success: true, data: { url } }`.
- Both follow the existing `ActionResult<T>` pattern from `src/actions/items.ts`.

### Webhook

Create `src/app/api/stripe/webhook/route.ts`:

- `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`.
- Verify `stripe-signature` against `STRIPE_WEBHOOK_SECRET` using the **raw** request body (`await req.text()`). On invalid signature → 400, no DB write.
- Handle: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.payment_succeeded|failed`. All other event types → 200 noop.
- For checkout/subscription events, derive `priceId` from `sub.items.data[0]?.price.id` and `currentPeriodEnd` from `sub.current_period_end * 1000`. `isPro = sub.status === 'active' || sub.status === 'trialing'`.
- Call `setSubscriptionState(customerId, …)`. Idempotent — repeated events for the same subscription just re-write the same row.
- Errors thrown inside the handler return 500 so Stripe retries.
- **Do not** call `await auth()` in this route. Stripe authenticates by signing the body.
- **Do not** call `req.json()` before signature verification — it consumes the body and breaks `constructEvent`.

### Free-tier gating

Modify `src/actions/items.ts` `createItem`:

- After auth, before the `createItemQuery` call, run `const limit = await canCreate(session.user.id, 'items')`. If `!limit.allowed` return `{ success: false, error: 'Free plan limit of <N> items reached. Upgrade to Pro for unlimited.' }` (use the actual `limit.limit`).

Same shape in `src/actions/collections.ts` `createCollection` with `'collections'`.

### UI components

Create:

- `src/components/billing/UpgradeButton.tsx` — client component. Takes `interval: BillingInterval` and children. Calls `createCheckoutSession`, `window.location.href = data.url` on success, `toast.error` on failure.
- `src/components/billing/ManageSubscriptionButton.tsx` — client. Calls `createPortalSession`, redirects on success.
- `src/components/settings/SubscriptionCard.tsx` — server component. Reads `getBillingProfile(userId)`. Pro path: "DevStash Pro — Renews on {date}" + `<ManageSubscriptionButton />`. Free path: plan summary + two `<UpgradeButton />` (monthly + yearly) with the marketing copy ("$8/month" and "$6/month, billed yearly · $72").
- `src/components/settings/CheckoutToast.tsx` — tiny client component. Reads `useSearchParams()`. On `?checkout=success` show success toast and `router.replace('/settings')`. On `?checkout=cancel` show info toast and replace.

### Settings page

Modify `src/app/settings/page.tsx`:

- Render `<SubscriptionCard userId={session.user.id} />` between Editor preferences and Account.
- Render `<CheckoutToast />` once at the top.

### Limit-reached banners

Modify `src/components/items/NewItemDialog.tsx` and `src/components/collections/NewCollectionDialog.tsx`:

- When the action returns an error string starting with `Free plan limit`, render an inline banner inside the dialog (not just a toast) with the explanation text and an `<UpgradeButton interval="monthly">Upgrade</UpgradeButton>` cta. The submit button stays disabled in that state.

### Marketing CTAs

Refactor `src/components/home/Pricing.tsx` to be session-aware:

- Split into a server component (`Pricing`) that reads `await auth()` once and a client component (`PricingPlans`) that takes `{ initialPeriod, isAuthenticated, isPro }` and owns the period toggle.
- Plan card CTA logic:
  - Unauthenticated → `Link href="/register"` (current behavior).
  - Authenticated and not Pro → `<UpgradeButton interval={period}>Upgrade to Pro</UpgradeButton>`.
  - Authenticated and Pro → render a disabled "Current plan" pill (no action).
- Free plan card stays a link to `/register` for unauthenticated, becomes a disabled "Your plan" pill for authenticated free users (and disappears for Pro users — they can't downgrade from here, only via the Portal).

### Sidebar polish

Modify `src/components/dashboard/Sidebar.tsx`: when `session.user.isPro`, show a small shadcn `Badge` reading "PRO" in the user menu (both collapsed and expanded variants). Skip if `isPro === false`.

## Files to Create

1. `src/actions/billing.ts`
2. `src/actions/billing.test.ts`
3. `src/app/api/stripe/webhook/route.ts`
4. `src/components/billing/UpgradeButton.tsx`
5. `src/components/billing/ManageSubscriptionButton.tsx`
6. `src/components/settings/SubscriptionCard.tsx`
7. `src/components/settings/CheckoutToast.tsx`

## Files to Modify

- `src/actions/items.ts` — `canCreate` gate.
- `src/actions/items.test.ts` — add limit-reached coverage.
- `src/actions/collections.ts` — `canCreate` gate.
- `src/actions/collections.test.ts` — add limit-reached coverage.
- `src/components/items/NewItemDialog.tsx` — limit banner.
- `src/components/collections/NewCollectionDialog.tsx` — limit banner.
- `src/components/home/Pricing.tsx` (split into server + client).
- `src/app/settings/page.tsx` — Subscription card + CheckoutToast.
- `src/components/dashboard/Sidebar.tsx` — Pro badge.

## Stripe Dashboard Setup (required before testing)

Follow [docs/stripe-integration-plan.md §4](docs/stripe-integration-plan.md):

1. **Test mode** API keys → `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` in `.env`.
2. Create a "DevStash Pro" product with two recurring prices: $8/mo and $72/yr → IDs into `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`.
3. Configure the Customer Portal (cancel, update payment, invoice history, plan switch monthly ↔ yearly).
4. Run `stripe login` once, then in a separate terminal: `stripe listen --forward-to http://localhost:3000/api/stripe/webhook`. Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.

## Unit Tests

`src/actions/billing.test.ts` — mock `auth()` and the Stripe SDK module:

- Unauthorized → `{ success: false, error: 'Unauthorized' }`, no Stripe call.
- Invalid `interval` → validation error.
- Missing price config (`STRIPE_PRICE_IDS.monthly === ''`) → `'Plan not configured'`.
- Stripe `customers.create` / `checkout.sessions.create` rejects → returns `'Failed to start checkout'`, error logged.
- Happy path → returns `{ url }`.
- `createPortalSession`: unauthorized; user with no `stripeCustomerId` → `'No subscription found'`; happy path returns portal URL.

Extend `src/actions/items.test.ts` and `src/actions/collections.test.ts`:

- Mock `canCreate` (or the underlying `prisma.item.count` / `prisma.collection.count`) to simulate at-limit. Assert `createItem` / `createCollection` returns the limit-reached error and **does not** call the underlying create query.

## Manual Testing (requires Stripe CLI)

Run `npm run dev` and `stripe listen --forward-to http://localhost:3000/api/stripe/webhook` side by side. Use test card `4242 4242 4242 4242`, any future date, any CVC, any ZIP.

End-to-end flow:

1. Sign in as a free user. Visit `/settings`. Subscription card shows "Free plan".
2. Click **Upgrade — Monthly**. Lands on Stripe Checkout. Complete with the test card.
3. Redirected to `/settings?checkout=success`. Toast appears. Card now shows "DevStash Pro — Renews on {date}".
4. Stripe CLI window prints `checkout.session.completed` and `customer.subscription.created` — verify both fired.
5. DB inspection (`npx prisma studio`): user row has `isPro=true`, `stripeCustomerId`, `stripeSubscriptionId`, `stripeCurrentPeriodEnd`, `stripePriceId` populated.
6. Click **Manage subscription**. Lands on Customer Portal. Cancel. Returns to `/settings`. Stripe CLI fires `customer.subscription.updated` (cancel_at_period_end=true). DB `isPro` stays `true`; UI now reads "Cancels on {date}".
7. Force the cancel-at-period-end completion: `stripe trigger customer.subscription.deleted`. DB `isPro` flips to `false`. Reload the page; UI shows Free plan; sidebar Pro badge disappears.
8. Limit gating (free user): create 50 items, the 51st `createItem` returns the limit error; the New Item dialog shows the upgrade banner. 4th collection creation blocked the same way.
9. Pro user can create 51+ items / 4+ collections without error.
10. Marketing homepage (`/`) while signed in as free → Pro card CTA reads "Upgrade to Pro" and triggers Checkout. While signed in as Pro → "Current plan" disabled.

Webhook robustness:

- `curl -X POST http://localhost:3000/api/stripe/webhook` with no signature → 400, no DB write.
- Tamper with the body so the signature mismatches → 400.
- `stripe events resend <event_id>` (replay) → handler runs again with the same DB result. No duplicates.
- An event type not in `RELEVANT_EVENTS` (e.g. `charge.succeeded`) → 200, no DB write.

Build / CI:

- `npm run build` passes.
- `npm test` passes (the new billing/items/collections coverage on top of Phase 1's 79 + new tests).
- `npm run lint` clean.

## Key Gotchas

- **Raw body for signature.** `await req.text()` first, then pass to `stripe.webhooks.constructEvent`. Calling `req.json()` anywhere before that breaks verification.
- **Edge runtime is incompatible** with the Stripe SDK and with raw body access. The webhook route must declare `runtime = 'nodejs'`.
- **Don't `await auth()` in the webhook.** Stripe authenticates via the signed body; an auth check here would always fail.
- **`session.user.isPro` is advisory** for UI. Pro-gated server actions must re-read from DB (or call `getUsage()`) — the JWT can be stale immediately after `customer.subscription.deleted` in another tab.
- **Idempotency.** The webhook's `setSubscriptionState` uses `update` keyed on `stripeCustomerId`. Same event delivered twice produces the same row. If you ever record event IDs, key off `event.id` to dedupe.
- **Free-tier downgrade preserves data.** Block creation, never delete. A previously-Pro user who downgrades with 200 items keeps all 200 — they just can't add a 201st.
- **Local webhook secret ≠ production webhook secret.** The `whsec_…` printed by `stripe listen` is CLI-specific and only valid while it's running. Production needs a separate endpoint configured in the Stripe Dashboard with its own secret.
- **Pricing.tsx split.** It's currently `'use client'`. The session-aware path requires reading `auth()` server-side. Keep the period-toggle interactivity in a child client component; the parent becomes a server component that passes `isAuthenticated` / `isPro` down.
- **Don't log raw webhook bodies.** They contain customer email and other PII.
- **Tax / currency / refunds.** Out of scope for Phase 2. See [docs/stripe-integration-plan.md §7](docs/stripe-integration-plan.md) if needed later.

## Environment Variables

Required for this phase:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (from `stripe listen` for dev)
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
```

`NEXTAUTH_URL` (already in use by auth/email) is also read for `success_url`/`cancel_url`/`return_url`.

## References

- Stripe Checkout (subscriptions): https://docs.stripe.com/billing/subscriptions/checkout
- Stripe Customer Portal: https://docs.stripe.com/customer-management
- Stripe webhooks (Next.js App Router): https://docs.stripe.com/webhooks
- Stripe CLI: https://docs.stripe.com/stripe-cli
- Test cards: https://docs.stripe.com/testing#cards
- Project plan: [docs/stripe-integration-plan.md](docs/stripe-integration-plan.md) §§3.1 (last six files), 3.2 (excl. auth/types), 4, 5, 6 (steps 3–8), 7
