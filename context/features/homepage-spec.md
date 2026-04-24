# Homepage

## Overview

Port the marketing mockup at [prototypes/homepage/](prototypes/homepage/) into the real Next.js app at `/` (replacing the current `/dashboard` redirect in [src/app/page.tsx](src/app/page.tsx)). Signed-in users should still land on their dashboard; signed-out users see the marketing page.

## Requirements

- Replace the `/` redirect with a marketing page. If there is an active NextAuth session, redirect to `/dashboard`; otherwise render the homepage.
- Match the look and feel of the prototype (hero chaos → order visual, features grid, AI section, pricing, CTA band, footer).
- Use Tailwind v4 + shadcn/ui primitives (`Button`, `Card`, `Badge`, `Tabs` or `ToggleGroup` for billing period). Do not port the raw prototype CSS — rebuild styles with Tailwind utilities. Reuse the existing CSS variables from `globals.css` (item-type colors, theme tokens) where they exist.
- Buttons and links must point at real destinations:
  - "Sign in" → `/auth/signin`
  - "Get started" / "Get started free" / "Upgrade to Pro" / CTA band button → `/auth/register`
  - "Features" / "Pricing" nav links → in-page anchors (`#features`, `#pricing`)
  - Footer Features/Pricing → same anchors. Changelog/About/Blog/Contact/Privacy/Terms → `#` placeholders (leave a TODO comment).
  - Logo → `/`
- Reuse item-type colors from the project palette (snippet/prompt/command/note/link). The prototype's extra `file`/`image` colors are not in the real palette — drop those cards so the features grid matches the 5 real types plus a "Collections" card (6 total), using real palette values.

## Component Breakdown

All under [src/components/home/](src/components/home/). Default to server components; mark client only where interactivity requires it.

Server components:
- `Navbar.tsx` — fixed top nav with logo, nav links, Sign in / Get started buttons. Uses shadcn `Button`. (Scroll opacity handled by a tiny client sub-component or CSS-only backdrop blur — see Notes.)
- `Hero.tsx` — wraps hero text + `HeroVisual`. Headline with gradient span, subhead, two CTA buttons, meta line.
- `Features.tsx` — section heading + grid of 6 `FeatureCard`s. `FeatureCard.tsx` is a presentational server component that takes `{ icon, title, description, color }`.
- `AiSection.tsx` — two-column layout: left copy with Pro `Badge` + checklist + CTA; right is a static editor mockup with syntax-highlighted `<pre>` and AI tag chips.
- `CtaBand.tsx`
- `Footer.tsx` — renders column data from a local const array. Year is computed server-side (`new Date().getFullYear()`) — no client JS needed.

Client components (`'use client'`):
- `HeroVisual.tsx` — the chaos box + arrow + dashboard mock. Contains the `ChaosStage`.
- `ChaosStage.tsx` — port of the `requestAnimationFrame` animation from [prototypes/homepage/script.js](prototypes/homepage/script.js): floating icons, wall bounce, mouse repel, ResizeObserver bounds, `prefers-reduced-motion` fallback to a static grid. Icon SVGs live alongside as small components (or a single `chaos-icons.tsx` module exporting an array of `{ label, color, Icon }`).
- `Pricing.tsx` — holds `period` state (`'monthly' | 'yearly'`) and swaps Pro price/label. Use shadcn `Tabs` or `ToggleGroup` for the toggle. Plan cards themselves can live as server sub-components receiving props.
- `NavbarScroll.tsx` (optional) — adds a scroll listener and toggles a class/data-attr on the navbar for the opaque-on-scroll effect. Keep `Navbar` server and mount this as a sibling client child that targets the nav via a ref/context, OR make the whole `Navbar` client — pick whichever is simpler.

## Page Composition

[src/app/page.tsx](src/app/page.tsx):

```tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Navbar, Hero, Features, AiSection, Pricing, CtaBand, Footer } from '@/components/home';

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <AiSection />
        <Pricing />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
```

Consider a barrel `src/components/home/index.ts` for the imports above.

## Styling Notes

- Tailwind utilities only. No new global CSS except a `@keyframes` for the arrow pulse if needed (add via `@theme`/`@utility` in [src/app/globals.css](src/app/globals.css), not an external stylesheet).
- Item-type accent per card: pass `color` as a prop and apply via inline `style={{ '--c': color }}` + Tailwind arbitrary values (`bg-[color:var(--c)]/10`, `border-[color:var(--c)]/30`, etc.), mirroring the prototype's `--c` pattern.
- Gradient text: Tailwind `bg-clip-text text-transparent` + `bg-gradient-to-r`.
- Reveal-on-scroll is optional — skip it for the port, or add a tiny reusable `<Reveal>` client wrapper using `IntersectionObserver` if it's cheap. Prefer dropping it to keep client JS minimal.

## Content Data

Extract the six feature cards, AI checklist items, pricing plan bullets, and footer link columns into typed const arrays (either colocated in the component file or in `src/components/home/data.ts`) so the JSX stays thin.

## Out of Scope

- No real pricing/Stripe wiring — "Upgrade to Pro" just routes to `/auth/register`.
- No blog/changelog/legal pages — keep those links as `#` placeholders.
- No i18n, analytics, or SEO work beyond a basic `metadata` export on `page.tsx` (title + description from the prototype `<head>`).
