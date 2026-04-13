# Current Feature

## Status

Not Started

## Goals

<!-- Goals will be populated when a feature is loaded -->

## Notes

<!-- Notes will be populated when a feature is loaded -->

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
- 2026-04-11: Auth Phase 3 — Custom sign-in/register pages, reusable UserAvatar component, sidebar user menu with sign-out dropdown, dashboard uses real auth session, toast on registration
- 2026-04-12: Email Verification — Resend integration, EmailVerificationToken model, verify/resend API routes, verify-email page, proxy blocks unverified users from dashboard, delete-users utility script
- 2026-04-12: Email Verification Toggle — Added EMAIL_VERIFICATION_ENABLED env flag to enable/disable email verification, defaults to false for development without a Resend domain
- 2026-04-12: Forgot Password — Forgot/reset password flow using existing VerificationToken model, Resend emails, forgot-password and reset-password pages, "Forgot password?" link on sign-in page
- 2026-04-12: Profile Page — /profile route with user info (avatar, email, name, join date), usage stats (total items/collections, breakdown by item type), change password form (credentials users only), delete account with confirmation dialog, proxy updated to protect /profile
- 2026-04-12: Rate Limiting — Upstash Redis rate limiting on all auth endpoints (login, register, forgot/reset password, resend verification), reusable rate-limit utility with fail-open, frontend 429 error handling
- 2026-04-12: Fix GitHub OAuth Redirect — Switched GitHub sign-in from client-side signIn to server action with redirectTo, fixing the double-click redirect issue
- 2026-04-13: Items List View — Dynamic /items/[type] route with type-filtered Prisma query, reusable ItemCard with left border by type color, responsive 2-col grid on md+, shared dashboard shell layout, proxy protects /items/*
- 2026-04-13: Vitest Setup — Vitest configured for node env with native tsconfig path resolution, scoped to src/{lib,actions}/**/*.test.ts, sample test for formatDate, test/test:watch/test:coverage scripts, workflow docs updated to require npm test
- 2026-04-13: Items List 3-Column Grid — /items/[type] grid bumped to lg:grid-cols-3 while keeping 1-col mobile and 2-col md
