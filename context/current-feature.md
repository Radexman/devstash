# Current Feature: Item → Collections Assignment

## Status

In Progress

## Goals

- Let users assign an item to zero, one, or many collections from the new item form
- Let users update an item's collection memberships from the edit form in the item drawer
- Persist membership through the existing `ItemCollection` join table
- Show the user's available collections in a multi-select input within both forms

## Notes

- Scope is limited to the forms — collection detail/list pages are out of scope for this feature
- Collections shown must be user-scoped (only the signed-in user's collections)
- Both `createItem` and `updateItem` server actions + their Zod schemas need to accept a `collectionIds: string[]` field
- Queries: `createItem` should `connect` via the `collections` (`ItemCollection`) relation; `updateItem` should reconcile additions/removals safely
- `getItemDetail` should return the item's current `collectionIds` so the edit form can pre-populate
- Add Vitest coverage for the new action paths (empty set, one, many, ownership check that collections belong to the user)

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
- 2026-04-13: Item Drawer — Right-side shadcn Sheet drawer with action bar (favorite/pin/copy/edit/delete), opens on ItemCard/PinnedItems/RecentItems click on dashboard and items list. New getItemDetail query, /api/items/[id] auth-checked route, ItemDrawerProvider client context, skeleton while fetching
- 2026-04-15: Item Drawer Edit Mode — Inline edit toggle in drawer with Save/Cancel bar, controlled form (title/description/tags + type-specific content/language/url), new updateItem server action with Zod validation and ownership check, updateItem query with tag disconnect+connectOrCreate, shadcn Textarea component, zod dep, router.refresh() on save, Vitest coverage for the action
- 2026-04-15: Item Delete — New deleteItem server action (auth + ownership via deleteMany) and deleteItem query, drawer delete button now opens a shadcn Dialog confirmation, success/error toast, drawer closes and router.refresh() on success, Vitest coverage for unauthorized/not-found/success/throw
- 2026-04-15: Item Create — New createItem query (resolves system ItemType by name, connectOrCreate tags, sets contentType text/url) and createItem server action with Zod validation (enum type, title required, link requires URL via superRefine), new NewItemDialog client component wired into TopBar with type selector and dynamic content/language/url fields, toast + close + form reset + router.refresh() on success, Vitest coverage for unauthorized/empty title/link without url/success
- 2026-04-16: Code Editor — Monaco Editor component (CodeEditor.tsx) with macOS window dots, copy button, language label, vs-dark theme, fluid height (max 400px). Replaces <pre><code> display and Textarea editing for snippet/command types in ItemDrawer and NewItemDialog. Notes/prompts keep Textarea.
- 2026-04-16: Markdown Editor — MarkdownEditor component (MarkdownEditor.tsx) with Write/Preview tabs, react-markdown + remark-gfm, dark theme .markdown-preview CSS (headings, code blocks, lists, blockquotes, links, tables). Replaces Textarea for note/prompt types in ItemDrawer (view + edit) and NewItemDialog.
- 2026-04-19: Remove File/Image Types — Dropped File and Image system types, removed fileUrl/fileName/fileSize columns from Item (prisma migration), trimmed seed, iconMap, TYPE_LABELS, sidebar PRO gating, and ItemDrawer file viewer. Updated project-overview, item-types, item-crud-architecture docs to reflect the 5-type system (snippet, prompt, command, note, link).
- 2026-04-20: Collection Create — New createCollection query in src/lib/db/collections.ts (user-scoped via user.connect, returns CollectionSummary) and createCollection server action with Zod validation (name required, description trimmed/nullable), new NewCollectionDialog client component replacing TopBar placeholder button, toast + close + form reset + router.refresh() on success, Vitest coverage for unauthorized/empty name/success/description trim/query throw.
