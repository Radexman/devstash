---
name: DevStash Project Architecture
description: Core architecture, DB patterns, component structure, known issues — updated April 2026 post auth + CRUD implementation
type: project
---

DevStash is a Next.js 16 / React 19 / Prisma 7 / Tailwind v4 app. As of April 2026, full auth (NextAuth v5, credentials + GitHub OAuth, email verification, rate limiting) and item CRUD are implemented.

**Key patterns:**
- DB queries in `src/lib/db/collections.ts` and `src/lib/db/items.ts`; server actions in `src/actions/items.ts`
- Server components fetch via Prisma directly; client mutations via Server Actions (items) or API routes (auth, profile)
- Shared utilities: `iconMap` in `src/lib/item-icons.ts`, `formatDate` in `src/lib/format.ts`, `copyItemContent` in `src/lib/copy-item.ts`
- Server action pattern: `{ success, data, error }` return shape consistently used
- Rate limiting via Upstash Redis on all auth endpoints (fail-open)
- Proxy (middleware) enforces auth on `/dashboard/*`, `/profile/*`, `/items/*`

**Duplicate item card UI:**
- `PinnedItems.tsx`, `RecentItems.tsx`, and `ItemCard.tsx` all render near-identical left-border item cards. Strong candidate for a shared `ItemRow` component.

**Unbounded queries:**
- `getPinnedItems` has no `take` limit — could return all pinned items
- `getItemsByType` has no `take` limit — returns ALL items of a type

**Rate limiting gap:**
- `change-password` (`/api/users/change-password`) and `delete-account` (`/api/users/delete-account`) have no rate limiting

**Inconsistent password minimum:**
- Register page (`/register`) + reset-password API enforce 6 chars minimum
- Change-password API enforces 8 chars minimum — mismatch

**Type safety:**
- `token.id as string` cast in `src/auth.ts` session callback (line 21)

**Why:** Auth and CRUD are recent additions (April 2026). Previous audit memory was stale.
**How to apply:** When reviewing auth routes check for rate limiting. When reviewing DB queries watch for unbounded results.
