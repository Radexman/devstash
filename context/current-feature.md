# Auth UI - Sign In, Register & Sign Out

## Status

In Progress

## Goals

- Custom Sign In page (`/sign-in`) with email/password fields, GitHub OAuth button, and link to register
- Custom Register page (`/register`) with name, email, password, confirm password fields and validation
- Bottom-of-sidebar user section: avatar (GitHub image or initials fallback), user name, dropdown with "Sign out"
- Clicking avatar goes to `/profile`
- Reusable avatar component handling both GitHub image and initials cases

## Notes

- Avatar logic: if user has `image` (from GitHub), use it; otherwise generate initials from name (e.g., "Brad Traversy" -> "BT")
- Register form submits to existing `/api/auth/register` endpoint
- Redirect to sign-in on successful registration
- Form validation: passwords match, email format, error display
- Replace NextAuth default pages with custom UI

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
- 2026-04-11: Auth Phase 1 — NextAuth v5 with GitHub OAuth, split config pattern, Prisma adapter with JWT, /dashboard/* route protection via proxy, Session type extended with user.id
- 2026-04-11: Auth Phase 2 — Credentials provider with bcrypt validation, POST /api/auth/register endpoint with input validation and duplicate checking
