# Current Feature: Auth Setup — NextAuth + GitHub Provider

## Status

In Progress

## Goals

- Install NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`
- Set up split auth config pattern (edge-compatible config + full config with Prisma adapter)
- Add GitHub OAuth provider
- Protect `/dashboard/*` routes using Next.js 16 proxy
- Redirect unauthenticated users to sign-in
- Extend Session type with `user.id`

## Notes

- Spec: `context/features/auth-phase-1-spec.md`
- Use `next-auth@beta` (not `@latest` which installs v4)
- Proxy file must be at `src/proxy.ts` (same level as `app/`)
- Use named export: `export const proxy = auth(...)` not default export
- Use `session: { strategy: 'jwt' }` with split config pattern
- Don't set custom `pages.signIn` — use NextAuth's default page
- Env vars needed: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
- Files to create: `src/auth.config.ts`, `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/proxy.ts`, `src/types/next-auth.d.ts`

## History

- 2026-04-09: Initial Next.js 16 + Tailwind v4 setup, removed boilerplate assets, added project context files
- 2026-04-09: Dashboard Phase 1 — shadcn/ui init, dark mode, top bar, dashboard layout with sidebar/main placeholders
- 2026-04-09: Dashboard Phase 2 — Collapsible sidebar with item types, favorite/recent collections, user avatar, and mobile drawer
- 2026-04-09: Dashboard Phase 3 — Stats cards, collections grid, pinned items, recent items in main content area
- 2026-04-10: Dashboard Collections — Replaced dummy data with real Prisma queries, created src/lib/db/collections.ts, dominant type border color, type icons
- 2026-04-10: Dashboard Items — Replaced dummy item data with real Prisma queries for pinned items, recent items, and stats cards
- 2026-04-10: Stats & Sidebar — Real data for sidebar item types with counts, favorite/recent collections with dominant color circles, "View all collections" link, seed updated with favorite collections
- 2026-04-11: Pro Badge — Added PRO badge (shadcn/ui Badge) to File and Image types in sidebar
- 2026-04-11: Quick Wins — Deleted dead mock-data.ts, extracted shared iconMap and formatDate, fixed N+1 in getSidebarCollections, added take limits, replaced raw button with shadcn Link+buttonVariants
