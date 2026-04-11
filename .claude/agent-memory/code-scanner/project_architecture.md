---
name: DevStash Project Architecture
description: Core architecture, DB patterns, and known issues found during initial audit (April 2026)
type: project
---

DevStash is a Next.js 16 / React 19 / Prisma / Tailwind v4 app. Dashboard is the only implemented page so far. Auth is scaffolded (schema, seed) but not wired into UI — all queries use a hardcoded demo user lookup by email.

**Key patterns:**
- DB queries live in `src/lib/db/collections.ts` and `src/lib/db/items.ts`
- Server components fetch via Prisma directly (no API routes yet)
- `iconMap` (string → LucideIcon) is duplicated across 4 components: Sidebar, CollectionsSection, PinnedItems, RecentItems
- `formatDate` helper is duplicated in PinnedItems and RecentItems
- `PRO_TYPES` set matching by `type.name` (lowercase) vs seed data which uses lowercase names ("file", "image") — currently correct but fragile

**Known DB query issues:**
- `getSidebarCollections` and `getCollectionsForDashboard` both fetch ALL items for each collection with full itemType includes, just to compute dominant color — expensive as data grows
- Both layout and page independently call `getDemoUserId()` (two separate DB round trips per navigation)
- `getSystemItemTypes` fetches ALL system types without any user scoping on item counts — counts reflect global items, not per-user

**Why:** Auth not yet implemented; demo user hardcoded. Scaffold is in place for gating.
**How to apply:** When auth lands, replace all `getDemoUserId()` calls with session user. Flag the duplicate DB call between layout and page if optimizing.
