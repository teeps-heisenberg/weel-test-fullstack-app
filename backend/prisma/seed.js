import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const user1 = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      passwordHash: passwordHash,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "test2@example.com" },
    update: {},
    create: {
      email: "test2@example.com",
      passwordHash: passwordHash,
    },
  });

  console.log("Seed users created:");
  console.log(`User 1 - Email: ${user1.email}, Password: password123, ID: ${user1.id}`);
  console.log(`User 2 - Email: ${user2.email}, Password: password123, ID: ${user2.id}`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
