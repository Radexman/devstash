import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SYSTEM_ITEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
];

async function main() {
  console.log("Seeding database...\n");

  // --- Clean existing data ---
  console.log("0. Cleaning existing data...");
  await prisma.itemCollection.deleteMany();
  await prisma.item.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.user.deleteMany();
  await prisma.itemType.deleteMany();
  console.log("   ✓ Cleaned");

  // --- System Item Types ---
  console.log("\n1. Seeding system item types...");
  const typeMap: Record<string, string> = {};

  for (const type of SYSTEM_ITEM_TYPES) {
    const created = await prisma.itemType.create({
      data: { ...type, isSystem: true, userId: null },
    });
    typeMap[type.name] = created.id;
    console.log(`   ✓ ${type.name}`);
  }

  // --- Demo User ---
  console.log("\n2. Seeding demo user...");
  const hashedPassword = await hash("12345678", 12);

  const user = await prisma.user.create({
    data: {
      email: "demo@devstash.io",
      name: "Demo User",
      hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
  });
  console.log(`   ✓ ${user.name} (${user.email})`);

  // --- Collections & Items ---
  console.log("\n3. Seeding collections & items...");

  // Helper to create a collection, its items, and link them
  async function seedCollection(
    name: string,
    description: string,
    options: { isFavorite?: boolean },
    items: {
      title: string;
      contentType: string;
      typeName: string;
      content?: string;
      url?: string;
      language?: string;
      isFavorite?: boolean;
      isPinned?: boolean;
    }[]
  ) {
    const collection = await prisma.collection.create({
      data: { name, description, isFavorite: options.isFavorite ?? false, userId: user.id },
    });

    for (const item of items) {
      const created = await prisma.item.create({
        data: {
          title: item.title,
          contentType: item.contentType,
          content: item.content ?? null,
          url: item.url ?? null,
          language: item.language ?? null,
          isFavorite: item.isFavorite ?? false,
          isPinned: item.isPinned ?? false,
          userId: user.id,
          itemTypeId: typeMap[item.typeName],
        },
      });

      await prisma.itemCollection.create({
        data: { itemId: created.id, collectionId: collection.id },
      });
    }

    console.log(`   ✓ ${name} (${items.length} items)`);
  }

  // React Patterns
  await seedCollection("React Patterns", "Reusable React patterns and hooks", { isFavorite: true }, [
    {
      title: "useDebounce Hook",
      contentType: "text",
      typeName: "snippet",
      language: "typescript",
      isPinned: true,
      content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}`,
    },
    {
      title: "useLocalStorage Hook",
      contentType: "text",
      typeName: "snippet",
      language: "typescript",
      isFavorite: true,
      content: `import { useCallback, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}`,
    },
    {
      title: "Compound Component Pattern",
      contentType: "text",
      typeName: "snippet",
      language: "typescript",
      content: `import { createContext, useContext, useState, ReactNode } from "react";

interface AccordionContextType {
  openIndex: number | null;
  toggle: (index: number) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) throw new Error("useAccordion must be used within Accordion");
  return context;
}

export function Accordion({ children }: { children: ReactNode }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (index: number) =>
    setOpenIndex((prev) => (prev === index ? null : index));

  return (
    <AccordionContext.Provider value={{ openIndex, toggle }}>
      {children}
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  const { openIndex, toggle } = useAccordion();
  return (
    <div>
      <button onClick={() => toggle(index)}>{title}</button>
      {openIndex === index && <div>{children}</div>}
    </div>
  );
}`,
    },
  ]);

  // AI Workflows
  await seedCollection("AI Workflows", "AI prompts and workflow automations", {}, [
    {
      title: "Code Review Prompt",
      contentType: "text",
      typeName: "prompt",
      isFavorite: true,
      isPinned: true,
      content: `Review the following code for:
1. Security vulnerabilities (injection, XSS, auth bypass)
2. Performance issues (N+1 queries, unnecessary re-renders, memory leaks)
3. Error handling gaps (unhandled promises, missing try/catch)
4. Code style and readability
5. Edge cases not covered

Provide specific line-level feedback with suggested fixes. Prioritize issues by severity.`,
    },
    {
      title: "Documentation Generator",
      contentType: "text",
      typeName: "prompt",
      content: `Generate comprehensive documentation for the following code:

1. Overview: What does this module/function do?
2. Parameters: List each parameter with type and description
3. Return value: Type and description
4. Usage examples: 2-3 practical examples
5. Edge cases: Known limitations or gotchas

Use JSDoc format for functions, and markdown for module-level docs.`,
    },
    {
      title: "Refactoring Assistant",
      contentType: "text",
      typeName: "prompt",
      content: `Analyze this code and suggest refactoring improvements:

1. Identify code smells (long methods, deep nesting, repeated logic)
2. Suggest design patterns that could simplify the code
3. Recommend extraction opportunities (hooks, utilities, components)
4. Ensure backward compatibility — no breaking changes
5. Provide before/after examples for each suggestion

Focus on readability and maintainability over cleverness.`,
    },
  ]);

  // DevOps
  await seedCollection(
    "DevOps",
    "Infrastructure and deployment resources",
    {},
    [
      {
        title: "Multi-stage Dockerfile",
        contentType: "text",
        typeName: "snippet",
        language: "dockerfile",
        content: `FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --omit=dev

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./

EXPOSE 3000
CMD ["npm", "start"]`,
      },
      {
        title: "Deploy to production",
        contentType: "text",
        typeName: "command",
        content: `# Build and deploy with zero downtime
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
docker system prune -f`,
      },
      {
        title: "Vercel Documentation",
        contentType: "url",
        typeName: "link",
        url: "https://vercel.com/docs",
        isFavorite: true,
      },
      {
        title: "GitHub Actions Documentation",
        contentType: "url",
        typeName: "link",
        url: "https://docs.github.com/en/actions",
      },
    ]
  );

  // Terminal Commands
  await seedCollection(
    "Terminal Commands",
    "Useful shell commands for everyday development",
    { isFavorite: true },
    [
      {
        title: "Git: Interactive rebase last N commits",
        contentType: "text",
        typeName: "command",
        isPinned: true,
        content: `# Rebase last 5 commits interactively
git rebase -i HEAD~5

# Squash all commits on branch into one
git reset --soft main && git commit

# Undo last commit but keep changes
git reset --soft HEAD~1`,
      },
      {
        title: "Docker: Container management",
        contentType: "text",
        typeName: "command",
        content: `# Stop all running containers
docker stop $(docker ps -q)

# Remove all stopped containers and unused images
docker system prune -a --volumes

# View logs with follow
docker logs -f --tail 100 container_name

# Execute shell in running container
docker exec -it container_name sh`,
      },
      {
        title: "Process management",
        contentType: "text",
        typeName: "command",
        content: `# Find process using a port
lsof -i :3000
# or on Windows
netstat -ano | findstr :3000

# Kill process on port
kill -9 $(lsof -t -i :3000)

# Watch file changes and re-run
npx nodemon --watch src --exec "node dist/index.js"`,
      },
      {
        title: "Package manager utilities",
        contentType: "text",
        typeName: "command",
        isFavorite: true,
        content: `# Check for outdated packages
npm outdated

# Update all to latest (respecting semver)
npm update

# List all globally installed packages
npm list -g --depth=0

# Check why a package is installed
npm explain package-name

# Clean npm cache
npm cache clean --force`,
      },
    ]
  );

  // Design Resources
  await seedCollection(
    "Design Resources",
    "UI/UX resources and references",
    {},
    [
      {
        title: "Tailwind CSS Documentation",
        contentType: "url",
        typeName: "link",
        url: "https://tailwindcss.com/docs",
        isFavorite: true,
        isPinned: true,
      },
      {
        title: "shadcn/ui Components",
        contentType: "url",
        typeName: "link",
        url: "https://ui.shadcn.com/docs/components",
        isFavorite: true,
      },
      {
        title: "Radix UI Primitives",
        contentType: "url",
        typeName: "link",
        url: "https://www.radix-ui.com/primitives/docs/overview/introduction",
      },
      {
        title: "Lucide Icons",
        contentType: "url",
        typeName: "link",
        url: "https://lucide.dev/icons",
      },
    ]
  );

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
