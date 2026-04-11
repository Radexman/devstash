# Current feature

## Status

In Progress

## Goals

Low-risk quick wins from codebase audit (2026-04-11):

- [ ] Delete `src/lib/mock-data.ts` — 412 lines of dead code, no longer imported anywhere
- [ ] Extract shared `iconMap` into `src/lib/item-icons.ts` — currently duplicated in Sidebar, CollectionsSection, PinnedItems, and RecentItems
- [ ] Extract shared `formatDate` helper into `src/lib/format.ts` — duplicated in PinnedItems and RecentItems
- [ ] Fix N+1 in `getSidebarCollections` — fetches full item+itemType graph just to compute dominant color; select only `itemType.id` and `itemType.color` like `getCollectionsForDashboard` already does
- [ ] Replace raw `<button>` with shadcn `<Button>` in CollectionsSection "View all"
- [ ] Add `take` limit to `getSidebarCollections` — prevents unbounded sidebar growth as users create more collections

## Notes

None

## History

- 2026-04-09: Initial Next.js 16 + Tailwind v4 setup, removed boilerplate assets, added project context files
- 2026-04-09: Dashboard Phase 1 — shadcn/ui init, dark mode, top bar, dashboard layout with sidebar/main placeholders
- 2026-04-09: Dashboard Phase 2 — Collapsible sidebar with item types, favorite/recent collections, user avatar, and mobile drawer
- 2026-04-09: Dashboard Phase 3 — Stats cards, collections grid, pinned items, recent items in main content area
- 2026-04-10: Dashboard Collections — Replaced dummy data with real Prisma queries, created src/lib/db/collections.ts, dominant type border color, type icons
- 2026-04-10: Dashboard Items — Replaced dummy item data with real Prisma queries for pinned items, recent items, and stats cards
- 2026-04-10: Stats & Sidebar — Real data for sidebar item types with counts, favorite/recent collections with dominant color circles, "View all collections" link, seed updated with favorite collections
- 2026-04-11: Pro Badge — Added PRO badge (shadcn/ui Badge) to File and Image types in sidebar
