# 📚 DevStash — Project Overview

> **One fast, searchable, AI-enhanced hub for all developer knowledge & resources.**

---

## 🎯 Problem

Developers keep their essentials scattered across too many tools:

- 🧩 Code snippets in VS Code or Notion
- 🤖 AI prompts buried in chat histories
- 📄 Context files lost inside projects
- 🔖 Useful links in browser bookmarks
- 📚 Docs in random folders
- ⌨️ Commands in `.txt` files or `.bash_history`
- 🏗️ Project templates in GitHub gists

The result: constant context switching, lost knowledge, and inconsistent workflows. **DevStash unifies it all into a single, fast, AI-enhanced hub.**

---

## 👥 Target Users

| Persona                        | Needs                                                        |
| ------------------------------ | ------------------------------------------------------------ |
| **Everyday Developer**         | Quick access to snippets, prompts, commands, and links       |
| **AI-first Developer**         | A home for prompts, contexts, workflows, and system messages |
| **Content Creator / Educator** | Organized code blocks, explanations, and course notes        |
| **Full-stack Builder**         | Reusable patterns, boilerplates, and API examples            |

---

## ✨ Features

### A. Items & Item Types

Items are the atomic unit of DevStash. Each item has a **type**. Users can create custom types later, but the MVP ships with these **system types** (immutable):

| Type    | Icon         | Color               | Category | Plan |
| ------- | ------------ | ------------------- | -------- | ---- |
| Snippet | `Code`       | `#3b82f6` (blue)    | text     | Free |
| Prompt  | `Sparkles`   | `#8b5cf6` (purple)  | text     | Free |
| Command | `Terminal`   | `#f97316` (orange)  | text     | Free |
| Note    | `StickyNote` | `#fde047` (yellow)  | text     | Free |
| Link    | `Link`       | `#10b981` (emerald) | url      | Free |

**Content categories:** `text` (snippet, prompt, note, command), `url` (link).

**URL structure:** `/items/snippets`, `/items/prompts`, etc.

Items are quick to access and create via a **drawer UI**.

### B. Collections

Collections group items of any type. Items can belong to **multiple collections** (many-to-many).

Examples:

- _React Patterns_ — snippets + notes
- _Python Snippets_ — snippets only
- _Interview Prep_ — mixed

### C. Search

Powerful search across **content, tags, titles, and types**.

### D. Authentication

- Email / password
- GitHub OAuth

### E. Quality-of-life Features

- ⭐ Favorite collections and items
- 📌 Pin items to top
- 🕒 Recently used
- 📥 Import code from file
- ✍️ Markdown editor for text types
- 📦 Export data in multiple formats
- 🌙 Dark mode by default
- 🔗 Add/remove items to/from multiple collections
- 👁️ View which collections an item belongs to

### F. AI Features — Pro Only

Powered by **OpenAI `gpt-5-nano`**:

- 🏷️ Auto-tag suggestions
- 📝 AI summaries
- 💡 "Explain this code"
- ⚡ Prompt optimizer

---

## 🗄️ Data Model

> ⚠️ **Rough draft** — schema will evolve during implementation. Not final.

### Entity Relationships

```
User ──┬──< Item >──┬── ItemType
       │            │
       │            ├──< ItemCollection >── Collection ──> User
       │            │
       │            └──< Tag (many-to-many)
       │
       └──< Collection
```

### Prisma Schema (Draft)

```prisma
// ⚠️ ROUGH DRAFT — subject to change during implementation

model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  name                 String?
  image                String?
  // Pro / billing
  isPro                Boolean   @default(false)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  // Relations
  items                Item[]
  collections          Collection[]
  itemTypes            ItemType[] // null for system types
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}

model Item {
  id           String   @id @default(cuid())
  title        String
  contentType  String   // "text" | "url"
  content      String?
  url          String?  // for link types
  description  String?
  isFavorite   Boolean  @default(false)
  isPinned     Boolean  @default(false)
  language     String?  // optional, for code snippets
  // Relations
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemTypeId   String
  itemType     ItemType @relation(fields: [itemTypeId], references: [id])
  collections  ItemCollection[]
  tags         Tag[]    @relation("ItemTags")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([itemTypeId])
}

model ItemType {
  id       String  @id @default(cuid())
  name     String
  icon     String
  color    String
  isSystem Boolean @default(false)
  // Relations
  userId   String? // null = system type, available to everyone
  user     User?   @relation(fields: [userId], references: [id], onDelete: Cascade)
  items    Item[]

  @@unique([userId, name])
}

model Collection {
  id            String   @id @default(cuid())
  name          String
  description   String?
  isFavorite    Boolean  @default(false)
  defaultTypeId String?  // fallback type for empty collections
  // Relations
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items         ItemCollection[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
}

model ItemCollection {
  itemId       String
  collectionId String
  addedAt      DateTime @default(now())

  item         Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([itemId, collectionId])
  @@index([collectionId])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  items Item[] @relation("ItemTags")
}
```

> 🚨 **Migration rule:** Never use `prisma db push`. All schema changes go through proper migrations (`prisma migrate dev` → `prisma migrate deploy`).

---

## 🛠️ Tech Stack

### Framework & Language

- **[Next.js 16](https://nextjs.org/)** / **React 19** — SSR pages with dynamic components, API routes for backend, single codebase
- **[TypeScript](https://www.typescriptlang.org/)** — type safety end-to-end

### Database & ORM

- **[Neon](https://neon.tech/)** — serverless Postgres in the cloud
- **[Prisma 7](https://www.prisma.io/docs)** (latest — check docs) — ORM and migrations
- **Redis** — optional, for caching

### Auth

- **[NextAuth v5](https://authjs.dev/)** — Email/password + GitHub OAuth

### AI

- **[OpenAI `gpt-5-nano`](https://platform.openai.com/docs)** — tagging, summaries, code explanation, prompt optimization

### Styling & UI

- **[Tailwind CSS v4](https://tailwindcss.com/)**
- **[shadcn/ui](https://ui.shadcn.com/)** — component library
- **[Lucide](https://lucide.dev/)** — icons (matches shadcn)

---

## 💰 Monetization (Freemium)

|                      | **Free**  | **Pro — $8/mo or $72/yr** |
| -------------------- | --------- | ------------------------- |
| Items                | 50 total  | Unlimited                 |
| Collections          | 3         | Unlimited                 |
| Custom types         | ❌        | ✅ (later)                |
| Search               | Basic     | Basic                     |
| AI auto-tagging      | ❌        | ✅                        |
| AI code explanation  | ❌        | ✅                        |
| AI prompt optimizer  | ❌        | ✅                        |
| Export (JSON / ZIP)  | ❌        | ✅                        |
| Support              | Community | Priority                  |

> 🛠️ **Development note:** scaffold Pro gating from day one, but keep **all features unlocked for all users during development**.

---

## 🎨 UI / UX

### Design Direction

Modern, minimal, developer-focused. Dark mode default, light mode optional. Clean typography, generous whitespace, subtle borders and shadows. Syntax highlighting for all code blocks.

**References:** [Notion](https://notion.so) · [Linear](https://linear.app) · [Raycast](https://raycast.com)

### Screenshots

Refer to the screenshots below as a base base for the dashboard ui. It does not have to be exact.
Use it as a reference

- @context/screenshots/dashboard-ui-main.png
- @context/screenshots/dashboard-ui-drawer.png

### Layout

```
┌─────────────┬──────────────────────────────────────┐
│             │                                      │
│   Sidebar   │          Main Content                │
│             │                                      │
│  Item Types │   ┌─────────┐  ┌─────────┐          │
│  • Snippets │   │Collection│ │Collection│          │
│  • Prompts  │   │  Card   │  │  Card   │          │
│  • Commands │   └─────────┘  └─────────┘          │
│  • Notes    │                                      │
│  • Links    │   Items (color-coded border)         │
│             │   ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│             │   │ 📄│ │ ⚡│ │ 💻│ │ 🔗│           │
│             │   └───┘ └───┘ └───┘ └───┘           │
│ Collections │                                      │
│  • Recent…  │                                      │
│             │                                      │
└─────────────┴──────────────────────────────────────┘
                           ↓
              Item click → Drawer opens
```

- **Sidebar** (collapsible): item types with links, latest collections
- **Main**: grid of **collection cards**, background-colored by their dominant item type; items shown below with **border color** matching their type
- **Items** open in a **quick-access drawer**

### Responsive

Desktop-first but fully mobile-usable. Sidebar collapses to a drawer on mobile.

### Micro-interactions

- Smooth transitions
- Hover states on cards
- Toast notifications for actions
- Loading skeletons

---

## 📋 Suggested Next Steps

1. Initialize Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui
2. Set up Neon database and Prisma with initial migration
3. Configure NextAuth v5 (credentials + GitHub)
4. Seed system `ItemType` rows
5. Build Item CRUD + drawer UI
6. Build Collection CRUD + grid layout
7. Wire up search
8. Integrate Stripe + Pro gating (scaffolded, unlocked in dev)
9. Layer in AI features
