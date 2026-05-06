# Stripe Integration Plan — DevStash Pro

> **Goal:** wire Stripe Subscriptions into DevStash so users can upgrade to Pro ($8/mo monthly, $72/yr annual = $6/mo billed yearly), with checkout, webhooks, the customer billing portal, feature gating, and a Pro-aware session.

This plan is grounded in the current state of the codebase as of `feature/shared-folder-logo` (merged on `main`). Code examples follow the conventions already in use: Prisma + Neon, NextAuth v5 with JWT sessions, Zod-validated server actions returning `ActionResult<T>`, NextResponse JSON for API routes, Upstash rate limiting, and Tailwind v4 + shadcn UI.

---

## 1. Current State Analysis

### 1.1 User schema (already prepared)

[prisma/schema.prisma:64–85](prisma/schema.prisma#L64-L85) — `User` already has the columns we need:

```prisma
isPro                Boolean   @default(false)
stripeCustomerId     String?   @unique
stripeSubscriptionId String?   @unique
```

The `@unique` constraints let webhooks safely look up users by Stripe IDs. **No migration is needed for the happy path.** A follow-on migration is recommended to record subscription state (see §2.6).

### 1.2 Auth & session

- [src/auth.ts](src/auth.ts) — NextAuth v5 with `session: { strategy: "jwt" }`, Prisma adapter, Credentials + GitHub.
- JWT callback only stores `id` and `emailVerified`; **`isPro` is not yet on the token**.
- [src/types/next-auth.d.ts](src/types/next-auth.d.ts) — Session type extension; needs `isPro` added.
- [src/proxy.ts](src/proxy.ts) — middleware-equivalent that gates `/dashboard`, `/profile`, `/settings`, `/items`, `/collections`, `/favorites`. Reads `req.auth` only — **does not read `isPro`**, so route gating happens here only if we add it.

### 1.3 How user data flows today

- Server components: `const session = await auth()` → `session.user.id` (e.g. [src/app/profile/page.tsx:14](src/app/profile/page.tsx#L14)).
- Server actions: same pattern — see [src/actions/items.ts:68–71](src/actions/items.ts#L68-L71). All return `ActionResult<T> = { success: true; data: T } | { success: false; error: string }`.
- API routes: `await auth()` then `NextResponse.json({...}, { status })` — see [src/app/api/users/change-password/route.ts](src/app/api/users/change-password/route.ts).
- DB queries live in `src/lib/db/*` and accept `userId` as the first arg — never trust client-supplied IDs.

### 1.4 Existing Stripe traces

- [.env.example:7-12](.env.example#L7-L12) — env vars are already declared empty: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`.
- [src/components/home/Pricing.tsx](src/components/home/Pricing.tsx) — marketing toggle ($8 ↔ $6) on `/`. Both CTAs currently point to `/register`; we'll keep that for unauth and route signed-in users through Checkout.
- No `isPro` reads anywhere in `src/components/**`, no `import 'stripe'`, no webhook routes.

### 1.5 Patterns to reuse

| Concern | Pattern | Source |
|---|---|---|
| Rate limiting | `rateLimiters.<x>` + `checkRateLimit()` | [src/lib/rate-limit.ts](src/lib/rate-limit.ts) |
| Email | Resend client per template | [src/lib/email.ts](src/lib/email.ts) |
| Action results | `{ success, data | error }` | [src/actions/items.ts:60–62](src/actions/items.ts#L60-L62) |
| Validation | Zod schema → `safeParse` → `issues[0].message` | [src/actions/items.ts:73–77](src/actions/items.ts#L73-L77) |
| Auth check in routes | `await auth()` → 401 if no `session.user.id` | [src/app/api/users/change-password/route.ts:7-11](src/app/api/users/change-password/route.ts#L7-L11) |
| DB layer | `src/lib/db/<entity>.ts` with userId-scoped queries | [src/lib/db/users.ts](src/lib/db/users.ts) |

---

## 2. Feature Gating Analysis

### 2.1 Plan limits (from [context/project-overview.md](context/project-overview.md))

| Feature | Free | Pro |
|---|---|---|
| Items | 50 total | Unlimited |
| Collections | 3 | Unlimited |
| Custom item types | ❌ | ✅ (later) |
| Export (JSON / ZIP) | ❌ | ✅ |
| AI auto-tagging | ❌ | ✅ |
| AI code explanation | ❌ | ✅ |
| AI prompt optimizer | ❌ | ✅ |

Everything is unlocked in development per the project-overview note. Gating must be **scaffolded** but easy to flip on.

### 2.2 Where to enforce limits

| Limit | Enforcement point |
|---|---|
| 50 items | [src/actions/items.ts](src/actions/items.ts) `createItem` — count user items before insert |
| 3 collections | [src/actions/collections.ts](src/actions/collections.ts) `createCollection` — count user collections before insert |
| Pro AI endpoints | New `/api/ai/*` routes — check `isPro` after auth |
| Custom item types | Future `createItemType` action — check `isPro` |
| Export | Future `/api/export` route — check `isPro` |

### 2.3 No existing gating

No counts are checked in `createItem` or `createCollection` today. Any limit logic must be introduced as part of this work, with a single source of truth (`src/lib/plan-limits.ts` — see §3).

### 2.4 Settings page

[src/app/settings/page.tsx](src/app/settings/page.tsx) currently has Editor preferences + Account (password + delete). We add a **Subscription** card here that shows the user's plan and a "Manage subscription" / "Upgrade" button.

### 2.5 Sidebar/UI signal

History notes a former PRO badge on File/Image item types — both types are now removed. No UI currently surfaces `isPro`. We'll add:

- Pro badge in the sidebar user menu when `isPro = true`.
- Inline "Upgrade to Pro" CTA in the New Item / New Collection dialogs when the limit is hit.

### 2.6 Optional schema enhancement

Current schema only stores `isPro` (boolean) and the two Stripe IDs. For correct billing UX (cancellation grace period, status messaging) we should add:

```prisma
model User {
  // existing fields ...
  stripePriceId          String?    // monthly vs yearly price the user is on
  stripeCurrentPeriodEnd DateTime?  // when the current period ends
  // 'isPro' becomes derived: isPro = stripeCurrentPeriodEnd != null && stripeCurrentPeriodEnd > now()
}
```

We **keep `isPro`** for cheap reads and write it from webhooks. The two new columns let us:
- Show "Renews on Jan 15" or "Cancels on Jan 15".
- Decide which checkout button to disable.
- Audit drift between Stripe and our DB.

This requires a migration: `prisma migrate dev --name add_stripe_subscription_state`.

---

## 3. Implementation Plan

### 3.1 Files to create

#### `src/lib/stripe.ts` — Stripe SDK singleton

```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.acacia', // pin — verify the latest at https://docs.stripe.com/api/versioning
  typescript: true,
});

export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY ?? '',
  yearly: process.env.STRIPE_PRICE_ID_YEARLY ?? '',
} as const;

export type BillingInterval = keyof typeof STRIPE_PRICE_IDS;
```

#### `src/lib/plan-limits.ts` — Free-tier limits + check helpers

```typescript
import { prisma } from '@/lib/prisma';

export const FREE_LIMITS = {
  items: 50,
  collections: 3,
} as const;

export type LimitName = keyof typeof FREE_LIMITS;

export async function getUsage(userId: string) {
  const [items, collections, user] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isPro: true },
    }),
  ]);
  return { items, collections, isPro: user?.isPro ?? false };
}

export async function canCreate(userId: string, name: LimitName): Promise<{
  allowed: boolean;
  reason?: 'limit_reached';
  used: number;
  limit: number;
}> {
  const usage = await getUsage(userId);
  if (usage.isPro) {
    return { allowed: true, used: usage[name], limit: Infinity };
  }
  const used = usage[name];
  const limit = FREE_LIMITS[name];
  return {
    allowed: used < limit,
    reason: used < limit ? undefined : 'limit_reached',
    used,
    limit,
  };
}
```

#### `src/lib/db/billing.ts` — DB helpers for Stripe state

```typescript
import { prisma } from '@/lib/prisma';

export async function getOrCreateStripeCustomerId(
  userId: string,
  email: string,
  stripe: import('stripe').default,
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

export async function setSubscriptionState(
  customerId: string,
  data: {
    subscriptionId: string | null;
    priceId: string | null;
    currentPeriodEnd: Date | null;
    isPro: boolean;
  },
) {
  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: data.subscriptionId,
      stripePriceId: data.priceId,
      stripeCurrentPeriodEnd: data.currentPeriodEnd,
      isPro: data.isPro,
    },
  });
}

export async function getBillingProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      stripeCurrentPeriodEnd: true,
    },
  });
}
```

#### `src/actions/billing.ts` — server actions for Checkout + Portal

```typescript
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { stripe, STRIPE_PRICE_IDS, type BillingInterval } from '@/lib/stripe';
import { getOrCreateStripeCustomerId } from '@/lib/db/billing';
import { prisma } from '@/lib/prisma';

const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'yearly']),
});

export type CreateCheckoutPayload = z.input<typeof checkoutSchema>;
type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createCheckoutSession(
  payload: CreateCheckoutPayload,
): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) return { success: false, error: 'Invalid plan' };

  const interval: BillingInterval = parsed.data.interval;
  const priceId = STRIPE_PRICE_IDS[interval];
  if (!priceId) return { success: false, error: 'Plan not configured' };

  try {
    const customerId = await getOrCreateStripeCustomerId(
      session.user.id,
      session.user.email,
      stripe,
    );

    const baseUrl = process.env.NEXTAUTH_URL ?? '';
    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings?checkout=success`,
      cancel_url: `${baseUrl}/settings?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: { userId: session.user.id },
      subscription_data: { metadata: { userId: session.user.id } },
    });

    if (!checkout.url) return { success: false, error: 'Could not create session' };
    return { success: true, data: { url: checkout.url } };
  } catch (error) {
    console.error('createCheckoutSession failed', error);
    return { success: false, error: 'Failed to start checkout' };
  }
}

export async function createPortalSession(): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    return { success: false, error: 'No subscription found' };
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? '';
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/settings`,
    });
    return { success: true, data: { url: portal.url } };
  } catch (error) {
    console.error('createPortalSession failed', error);
    return { success: false, error: 'Failed to open portal' };
  }
}
```

> Why server actions instead of API routes for these two? They redirect the browser to Stripe-hosted pages and don't need to be hit by webhooks or external clients. Aligns with the codebase's preference for server actions (see [context/coding-standards.md](context/coding-standards.md)).

#### `src/app/api/stripe/webhook/route.ts` — webhook handler

```typescript
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { setSubscriptionState } from '@/lib/db/billing';

export const runtime = 'nodejs'; // Stripe SDK needs Node, not Edge
export const dynamic = 'force-dynamic';

const RELEVANT_EVENTS = new Set<Stripe.Event.Type>([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await req.text(); // raw body required for signature verification

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    console.error(`Webhook handler failed for ${event.type}`, err);
    // Return 500 so Stripe retries — but only for transient failures.
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      if (!s.subscription || !s.customer) return;
      const sub = await stripe.subscriptions.retrieve(s.subscription as string);
      await syncSubscription(sub);
      return;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(sub);
      return;
    }
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      if (typeof inv.subscription === 'string') {
        const sub = await stripe.subscriptions.retrieve(inv.subscription);
        await syncSubscription(sub);
      }
      return;
    }
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price.id ?? null;
  const isActive = sub.status === 'active' || sub.status === 'trialing';

  await setSubscriptionState(customerId, {
    subscriptionId: sub.id,
    priceId,
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    isPro: isActive,
  });
}
```

> The webhook intentionally does not require auth — Stripe authenticates by signing the body. **Never** add `await auth()` here. Also: do **not** call `req.json()` first; signature verification needs the exact bytes from `req.text()`.

#### `src/components/billing/UpgradeButton.tsx` — client trigger for Checkout

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/actions/billing';
import type { BillingInterval } from '@/lib/stripe';

export function UpgradeButton({
  interval,
  className,
  children,
}: {
  interval: BillingInterval;
  className?: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      className={className}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const res = await createCheckoutSession({ interval });
        if (!res.success) {
          toast.error(res.error);
          setLoading(false);
          return;
        }
        window.location.href = res.data.url;
      }}
    >
      {loading ? 'Redirecting…' : children}
    </Button>
  );
}
```

#### `src/components/billing/ManageSubscriptionButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createPortalSession } from '@/actions/billing';

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const res = await createPortalSession();
        if (!res.success) {
          toast.error(res.error);
          setLoading(false);
          return;
        }
        window.location.href = res.data.url;
      }}
    >
      {loading ? 'Opening…' : 'Manage subscription'}
    </Button>
  );
}
```

#### `src/components/settings/SubscriptionCard.tsx` — server component on /settings

Pulls billing info via `getBillingProfile(userId)`, renders either:
- **Pro:** "DevStash Pro — Renews on {date}" + `<ManageSubscriptionButton />`.
- **Free:** plan summary + two `<UpgradeButton interval="monthly|yearly" />` buttons.

#### Tests

- `src/actions/billing.test.ts` — mock Stripe SDK; cover unauthorized, invalid interval, missing price config, Stripe error → failure result, success → returns URL.
- `src/lib/plan-limits.test.ts` — mock prisma; pro user always allowed, free user under/over each limit.
- `src/lib/db/billing.test.ts` — `getOrCreateStripeCustomerId` returns existing ID, creates+stores when absent.

### 3.2 Files to modify

#### [src/auth.ts](src/auth.ts) — sync `isPro` on every JWT call

```typescript
import { prisma } from '@/lib/prisma'; // already imported

callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.emailVerified = user.emailVerified;
    }
    if (token.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { isPro: true },
      });
      token.isPro = dbUser?.isPro ?? false;
    }
    return token;
  },
  session({ session, token }) {
    if (token.id) session.user.id = token.id as string;
    session.user.emailVerified = token.emailVerified as Date | null;
    session.user.isPro = (token.isPro as boolean | undefined) ?? false;
    return session;
  },
},
```

> See research notes — `trigger === "update"` is unreliable for webhook-driven updates. The cost is one extra `findUnique` (`select: { isPro: true }`) per session validation, which is negligible against a Neon pooled connection.

#### [src/types/next-auth.d.ts](src/types/next-auth.d.ts)

```typescript
declare module 'next-auth' {
  interface User {
    emailVerified?: Date | null;
    isPro?: boolean;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      emailVerified?: Date | null;
      isPro: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    emailVerified?: Date | null;
    isPro?: boolean;
  }
}
```

#### [src/actions/items.ts](src/actions/items.ts) — enforce 50-item limit

In `createItem`, after auth check, before the create call:

```typescript
const limit = await canCreate(session.user.id, 'items');
if (!limit.allowed) {
  return {
    success: false,
    error: `Free plan limit of ${limit.limit} items reached. Upgrade to Pro for unlimited.`,
  };
}
```

Same shape in [src/actions/collections.ts](src/actions/collections.ts) `createCollection` with `'collections'`.

#### [src/components/items/NewItemDialog.tsx](src/components/items/NewItemDialog.tsx) and `NewCollectionDialog.tsx`

Surface the `limit_reached` error with an inline upgrade prompt rather than a plain toast — render a small banner inside the dialog with an `<UpgradeButton interval="monthly">Upgrade</UpgradeButton>`. Detect by error string starting with `Free plan limit`.

#### [src/components/home/Pricing.tsx](src/components/home/Pricing.tsx)

Replace the `cta.href = '/register'` with a smarter CTA:

- If **unauthenticated** → keep `/register` (current behavior).
- If **authenticated & not Pro** → render `<UpgradeButton interval={period}>` instead of the Link.
- If **authenticated & Pro** → render a disabled "Current plan" pill.

This means converting `Pricing` from purely client to either:
- A server wrapper that reads `auth()` and passes a flag down, or
- A client component that calls `useSession()` (NextAuth client hook).

The server-wrapper approach is more consistent with the rest of the codebase — split into `Pricing` (server) + `PricingPeriodToggle` + `PricingCta` (client).

#### [src/app/settings/page.tsx](src/app/settings/page.tsx)

Add a `<SubscriptionCard userId={session.user.id} />` between Editor preferences and Account.

Also handle `?checkout=success` / `?checkout=cancel` query params: read them in the server component and pass to a small client `<CheckoutToast />` that shows a sonner toast on mount and `router.replace('/settings')` to clear the query.

#### [src/components/dashboard/Sidebar.tsx](src/components/dashboard/Sidebar.tsx) (optional polish)

Show a small Pro badge in the user menu when `session.user.isPro`. Reuse the shadcn `Badge` component.

#### `.env.example`

Already declares the keys. Optionally add a comment block explaining where to find them in the Stripe Dashboard.

#### `package.json`

Add the Stripe SDK:

```bash
npm install stripe
```

The Stripe Node SDK ships its own TypeScript types — no `@types/stripe` needed.

---

## 4. Stripe Dashboard Setup Steps

### 4.1 Account & API keys

1. Sign up / sign in at https://dashboard.stripe.com.
2. Stay in **Test mode** for development.
3. **Developers → API keys**: copy `STRIPE_SECRET_KEY` (sk_test_…) and `STRIPE_PUBLISHABLE_KEY` (pk_test_…).

### 4.2 Product & prices

1. **Catalog → Products → + Add product**.
2. Name: `DevStash Pro`. Description: `Unlimited items, collections, AI features, and exports`.
3. Add **two recurring prices**:
   - Monthly: $8.00 USD, billing period 1 month → copy ID into `STRIPE_PRICE_ID_MONTHLY` (e.g. `price_1Q…`).
   - Yearly: $72.00 USD, billing period 1 year → copy into `STRIPE_PRICE_ID_YEARLY`. (This works out to $6/mo, matching the marketing copy.)

### 4.3 Customer portal config

1. **Settings → Billing → Customer portal**.
2. Enable: cancel subscription, update payment method, view invoice history.
3. Allow plan switching between the monthly and yearly prices configured above.
4. Save.

### 4.4 Webhook endpoint

#### Local development (Stripe CLI)

```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

The CLI prints a `whsec_…` signing secret — paste into `.env` as `STRIPE_WEBHOOK_SECRET`. This secret is **CLI-specific** and only valid while `stripe listen` is running.

#### Production / staging

1. **Developers → Webhooks → + Add endpoint**.
2. URL: `https://<your-domain>/api/stripe/webhook`.
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy signing secret → set as `STRIPE_WEBHOOK_SECRET` in deployment environment (different value from local CLI).

### 4.5 Live mode (when launching)

Repeat 4.1–4.4 in **Live mode**, swap env vars in production. Until then, leave the `pk_live_…` / `sk_live_…` empty.

---

## 5. Testing Checklist

### 5.1 Local unit (`npm test`)

- [ ] `plan-limits` — pro user no limit, free under limit, free at limit, free over limit
- [ ] `billing.ts` actions — auth, validation, customer creation, error path
- [ ] `db/billing.ts` — get-or-create, set state
- [ ] (Existing) `items` / `collections` actions still pass after limit injection

### 5.2 Local end-to-end

Have `npm run dev` and `stripe listen --forward-to http://localhost:3000/api/stripe/webhook` running side by side.

- [ ] Sign in as a Free user. Visit `/settings`. Subscription card shows "Free plan".
- [ ] Click **Upgrade — Monthly**. Lands on Stripe Checkout. Use test card `4242 4242 4242 4242`, any future date, any CVC, any ZIP.
- [ ] After checkout, redirected back to `/settings?checkout=success`. Toast appears. Card now shows "DevStash Pro — Renews on {date}".
- [ ] In the Stripe CLI window, confirm `checkout.session.completed` and `customer.subscription.created` fired.
- [ ] DB: user has `isPro=true`, `stripeCustomerId`, `stripeSubscriptionId`, `stripeCurrentPeriodEnd`, `stripePriceId` populated.
- [ ] Click **Manage subscription**. Lands on Customer Portal. Cancel subscription. Returns to `/settings`.
- [ ] Stripe CLI confirms `customer.subscription.updated` (cancel_at_period_end=true). DB `isPro` stays `true` until period ends; UI shows "Cancels on {date}".
- [ ] Use Stripe CLI to **simulate the cancel-at-period-end completion**: `stripe trigger customer.subscription.deleted`. DB `isPro` flips to `false`. Page reload shows Free plan.
- [ ] As Free user, create 50 items. The 51st `createItem` call returns the limit error and the dialog shows the upgrade banner.
- [ ] As Free user, create 3 collections. The 4th attempt blocked similarly.
- [ ] Pro user can create 51+ items / 4+ collections without error.
- [ ] Failed payment: in the Customer Portal, change to a card that fails (`4000 0000 0000 0341` triggers fraud after auth). Trigger `invoice.payment_failed` from CLI. UI surfaces a "Payment failed" banner (future enhancement; for now, just confirm webhook fires and DB stays consistent).

### 5.3 Webhook robustness

- [ ] Send a request to `/api/stripe/webhook` with no signature → 400.
- [ ] Send with bad signature → 400, no DB write.
- [ ] Replay (same event ID twice via `stripe events resend`) → handler is idempotent (DB write is a single `update`; no duplicates).
- [ ] Unknown event type → 200 with no DB write.

### 5.4 Auth & session

- [ ] After webhook flips `isPro`, force a session refresh by reloading the page. `useSession()` reflects new value.
- [ ] Signing out + back in clears the cached `isPro` and re-reads from DB.

### 5.5 Build/CI

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm test` — all 79 existing tests + new ones pass

---

## 6. Implementation Order

Each step is a discrete branch + PR per the workflow in [context/ai-interaction.md](context/ai-interaction.md). Run `/feature load` for each.

1. **Schema + plan-limits scaffold** — add `stripePriceId` + `stripeCurrentPeriodEnd` columns, `prisma migrate dev --name add_stripe_subscription_state`, create `src/lib/plan-limits.ts` with helpers + tests. No behavior change yet.
2. **Auth wiring** — extend Session type, sync `isPro` in JWT callback, expose `session.user.isPro` everywhere. Confirm 79 tests still pass.
3. **Stripe SDK + Checkout + Portal** — `src/lib/stripe.ts`, `src/lib/db/billing.ts`, `src/actions/billing.ts` + tests. Manual smoke test: action returns a checkout URL given valid env vars.
4. **Webhook** — `src/app/api/stripe/webhook/route.ts`. Wire `stripe listen` locally, click through Checkout end-to-end, confirm DB writes.
5. **Settings UI** — `SubscriptionCard`, `UpgradeButton`, `ManageSubscriptionButton`, success/cancel toast on `/settings`. Visual smoke test on free + pro accounts.
6. **Limit enforcement** — inject `canCreate` into `createItem` / `createCollection`, surface the error inside the dialogs, ship the upgrade banner.
7. **Marketing CTA wiring** — make `Pricing` plan cards session-aware on `/`. Authenticated free users get inline Upgrade; Pro users see "Current plan".
8. **(Optional) Sidebar Pro badge.**

Steps 1–4 are foundation and must merge in order. 5–7 can be parallel but each should still be its own focused PR.

---

## 7. Important Caveats

- **Edge runtime is incompatible** with the Stripe SDK and with `req.text()` for raw body verification. Make sure the webhook route declares `runtime: 'nodejs'`.
- **Do not log raw request bodies** from the webhook route. They contain customer info.
- **`session.user.isPro` is advisory.** Server actions and API routes that gate Pro features must re-read `isPro` from the DB (or call `getUsage()`), since the JWT may be stale right after a `customer.subscription.deleted` event in another tab.
- **Idempotency.** The webhook handler uses `update` keyed on `stripeCustomerId`. Stripe may deliver the same event twice; the operation is naturally idempotent. If we ever record event IDs, key the DB write off `event.id` to dedupe.
- **Free-tier downgrade.** When a Pro user cancels and their period ends, they may be over the 50-item / 3-collection limits. Keep their data — only **block creation** of new items/collections, never delete. (This plan does that by design.)
- **Test cards** are at https://docs.stripe.com/testing#cards. Card number `4242 4242 4242 4242` succeeds; `4000 0000 0000 9995` fails with insufficient funds.
- **Currency.** This plan uses USD. If we add other currencies, create separate prices per currency in Stripe and pick the right `priceId` in `createCheckoutSession`.
- **Tax.** Not included. To enable Stripe Tax later, set `automatic_tax: { enabled: true }` on the checkout session and configure tax in the dashboard.
- **Refunds.** Handled in the Stripe Dashboard. The webhook handler doesn't need refund-specific events for the gating flow — `customer.subscription.deleted` covers downgrade.

---

## 8. Quick Reference — Files Touched

**Created**
- `src/lib/stripe.ts`
- `src/lib/plan-limits.ts`
- `src/lib/db/billing.ts`
- `src/actions/billing.ts`
- `src/actions/billing.test.ts`
- `src/lib/plan-limits.test.ts`
- `src/lib/db/billing.test.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/components/billing/UpgradeButton.tsx`
- `src/components/billing/ManageSubscriptionButton.tsx`
- `src/components/settings/SubscriptionCard.tsx`
- `src/components/settings/CheckoutToast.tsx`
- `prisma/migrations/<timestamp>_add_stripe_subscription_state/migration.sql`

**Modified**
- `prisma/schema.prisma` — `User.stripePriceId`, `User.stripeCurrentPeriodEnd`
- `src/auth.ts` — JWT callback syncs `isPro`
- `src/types/next-auth.d.ts` — Session/JWT augmentation
- `src/actions/items.ts` — `canCreate` gate in `createItem`
- `src/actions/collections.ts` — `canCreate` gate in `createCollection`
- `src/components/items/NewItemDialog.tsx` — limit-reached banner
- `src/components/collections/NewCollectionDialog.tsx` — limit-reached banner
- `src/components/home/Pricing.tsx` — session-aware CTAs
- `src/app/settings/page.tsx` — Subscription card + checkout toast
- `src/components/dashboard/Sidebar.tsx` — optional Pro badge
- `package.json` — `stripe` dep
