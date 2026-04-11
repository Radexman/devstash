# Current Feature: Add Pro Badge to Sidebar

## Status

In Progress

## Goals

- Add a PRO badge next to the Files and Images item types in the sidebar
- Use the shadcn/ui Badge component
- Badge should be clean and subtle
- PRO text should be all uppercase

## Notes

- Only Files and Images types get the badge (these are Pro-only item types per project spec)
- Keep the badge visually minimal so it doesn't overpower the sidebar item type list

## History

- 2026-04-09: Initial Next.js 16 + Tailwind v4 setup, removed boilerplate assets, added project context files
- 2026-04-09: Dashboard Phase 1 — shadcn/ui init, dark mode, top bar, dashboard layout with sidebar/main placeholders
- 2026-04-09: Dashboard Phase 2 — Collapsible sidebar with item types, favorite/recent collections, user avatar, and mobile drawer
- 2026-04-09: Dashboard Phase 3 — Stats cards, collections grid, pinned items, recent items in main content area
- 2026-04-10: Dashboard Collections — Replaced dummy data with real Prisma queries, created src/lib/db/collections.ts, dominant type border color, type icons
- 2026-04-10: Dashboard Items — Replaced dummy item data with real Prisma queries for pinned items, recent items, and stats cards
- 2026-04-10: Stats & Sidebar — Real data for sidebar item types with counts, favorite/recent collections with dominant color circles, "View all collections" link, seed updated with favorite collections
