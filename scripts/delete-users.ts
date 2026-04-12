import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const KEEP_EMAIL = "demo@devstash.io";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const toDelete = await prisma.user.findMany({
      where: { email: { not: KEEP_EMAIL } },
      select: { id: true, email: true },
    });

    if (toDelete.length === 0) {
      console.log("No users to delete (only the demo user exists).");
      return;
    }

    console.log(`Deleting ${toDelete.length} user(s):`);
    for (const u of toDelete) {
      console.log(`  - ${u.email}`);
    }

    const ids = toDelete.map((u) => u.id);

    // Cascade handles items, collections, accounts, sessions, tokens
    const result = await prisma.user.deleteMany({
      where: { id: { in: ids } },
    });

    console.log(`\nDeleted ${result.count} user(s) and all their content.`);
    console.log(`Kept: ${KEEP_EMAIL}`);
  } catch (error) {
    console.error("Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
