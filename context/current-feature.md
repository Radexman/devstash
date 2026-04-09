# Current feature

## Status

In Progress

## Goals

- Seed the database with demo data for development
- Create a demo user (demo@devstash.io, hashed password with bcryptjs)
- Seed 7 system item types (Snippet, Prompt, Command, Note, File, Image, Link)
- Seed 5 collections with items: React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources
- Override existing seed file (prisma/seed.ts) with full seed data

## Notes

- Spec: @context/features/seed-spec.md
- Existing seed file: @prisma/seed.ts (currently only seeds item types, will be overridden)

## History

- 2026-04-09: Initial Next.js 16 + Tailwind v4 setup, removed boilerplate assets, added project context files
- 2026-04-09: Dashboard Phase 1 — shadcn/ui init, dark mode, top bar, dashboard layout with sidebar/main placeholders
- 2026-04-09: Dashboard Phase 2 — Collapsible sidebar with item types, favorite/recent collections, user avatar, and mobile drawer
- 2026-04-09: Dashboard Phase 3 — Stats cards, collections grid, pinned items, recent items in main content area
