import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.$queryRawUnsafe<{ now: Date }[]>("SELECT NOW()");
    console.log("Connected! Server time:", result[0].now);

    // --- Demo User ---
    const user = await prisma.user.findUnique({
      where: { email: "demo@devstash.io" },
    });
    console.log("\n--- Demo User ---");
    console.log(`  Name: ${user?.name}`);
    console.log(`  Email: ${user?.email}`);
    console.log(`  Pro: ${user?.isPro}`);
    console.log(`  Verified: ${user?.emailVerified}`);

    // --- Item Types ---
    const itemTypes = await prisma.itemType.findMany({
      where: { isSystem: true },
      orderBy: { name: "asc" },
    });
    console.log(`\n--- System Item Types (${itemTypes.length}) ---`);
    for (const t of itemTypes) {
      console.log(`  ${t.icon.padEnd(12)} ${t.name.padEnd(10)} ${t.color}`);
    }

    // --- Collections with item counts ---
    const collections = await prisma.collection.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    });
    console.log(`\n--- Collections (${collections.length}) ---`);
    for (const c of collections) {
      console.log(`  ${c.name.padEnd(22)} ${c._count.items} items`);
    }

    // --- Items by type ---
    const items = await prisma.item.findMany({
      include: { itemType: true },
      orderBy: { createdAt: "desc" },
    });
    console.log(`\n--- Items (${items.length}) ---`);
    for (const item of items) {
      const flags = [
        item.isPinned ? "📌" : "",
        item.isFavorite ? "⭐" : "",
      ]
        .filter(Boolean)
        .join(" ");
      console.log(
        `  [${item.itemType.name.padEnd(7)}] ${item.title}${flags ? " " + flags : ""}`
      );
    }

    console.log("\nDatabase test passed!");
  } catch (error) {
    console.error("Database test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
