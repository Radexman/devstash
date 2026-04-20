---
name: DevStash Project Architecture
description: Core architecture, DB patterns, component structure, and known issues — updated April 2026 after full auth + CRUD implementation
type: project
---

DevStash is a Next.js 16 / React 19 / Prisma 7 / Tailwind v4 app. As of April 2026, full auth (NextAuth v5, credentials + GitHub OAuth, email verification, rate limiting) and item CRUD are implemented.

**Key patterns:**
- DB queries in `src/lib/db/collections.ts` and `src/lib/db/items.ts`; server actions in `src/actions/items.ts`
- Server components fetch via Prisma directly; client mutations go through Server Actions (items) or API routes (auth, profile)
- `iconMap` shared via `src/lib/item-icons.ts` (already deduplicated)
- `formatDate` shared via `src/lib/format.ts`
- `copyItemContent` shared via `src/lib/copy-item.ts`
- Server action pattern: `{ success, data, error }` return shape consistently used
- Rate limiting via Upstash Redis on all auth endpoints (fail-open)
- Proxy (middleware) enforces auth on `/dashboard/*`, `/profile/*`, `/items/*`

**Duplicate item card UI:**
- `PinnedItems.tsx`, `RecentItems.tsx`, and `ItemCard.tsx` all implement the same card layout with left-border color coding, tag badges, copy button, and date. Only differ in minor details. Strong candidate for a shared `ItemRow` component.

**Unbounded queries:**
- `getPinnedItems` has no `take` limit — could return all pinned items if user pins many
- `getItemsByType` has no `take` limit — returns ALL items of a type; could be very large

**N+1 / Overfetch:**
- `getCollectionsForDashboard` uses `include: { items: { include: { item: { include: { itemType: true } } } } }` — loads all items+types for each collection just to compute dominant color. Fine at small scale; will become expensive.
- `updateItem` in `src/lib/db/items.ts` does 2 sequential queries (findFirst ownership check + update + getItemDetail fetch). Not a true N+1 but 3 round trips per update.

**Inconsistent password minimum:**
- Register page/API enforces 6 chars minimum; change-password API enforces 8 chars. Mismatch.

**Rate limiting gap:**
- `change-password` and `delete-account` API routes have no rate limiting

**Type safety:**
- `token.id as string` cast in `src/auth.ts` session callback (line 21) — works but not type-safe
- `credentials.email as string` / `credentials.password as string` casts in authorize

**Why:** Auth and CRUD are recent additions (April 2026).
**How to apply:** When reviewing auth routes, check for rate limiting gaps. When reviewing DB queries, watch for unbounded results.
