import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.$queryRawUnsafe<{ now: Date }[]>("SELECT NOW()");
    console.log("Connected! Server time:", result[0].now);

    const userCount = await prisma.user.count();
    console.log("Users in database:", userCount);

    const itemTypeCount = await prisma.itemType.count();
    console.log("Item types in database:", itemTypeCount);

    console.log("\nDatabase connection test passed!");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
