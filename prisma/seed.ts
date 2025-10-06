import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  if (process.env.MONGODB_URI) {
    return;
  }

  const candidateFiles = [".env.local", ".env"];

  for (const file of candidateFiles) {
    const fullPath = resolve(process.cwd(), file);
    if (!existsSync(fullPath)) {
      continue;
    }

    const content = readFileSync(fullPath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      if (!line || line.trim().startsWith("#")) {
        continue;
      }
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) {
        continue;
      }
      const [, key, rawValue] = match;
      if (process.env[key]) {
        continue;
      }
      let value = rawValue;
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }

    if (process.env.MONGODB_URI) {
      break;
    }
  }
}

loadEnv();

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Web Logins", slug: "web-logins" },
  { name: "Bank Accounts", slug: "bank-accounts" },
  { name: "Credit Cards", slug: "credit-cards" },
  { name: "Email Accounts", slug: "email-accounts" },
  { name: "Social Media Accounts", slug: "social-media-accounts" },
  { name: "Identity Documents", slug: "identity-documents" },
  { name: "Wifi Passwords", slug: "wifi-passwords" },
  { name: "Notes", slug: "notes" },
  { name: "Others", slug: "others" },
];

async function seedCategoriesForAllUsers() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  if (users.length === 0) {
    console.log("No users found. Seeded 0 categories.");
    return;
  }

  let totalCreated = 0;

  for (const user of users) {
    const existing = await prisma.category.findMany({
      where: { userId: user.id },
      select: { slug: true },
    });

    const existingSlugs = new Set(existing.map((category) => category.slug));
    const missing = DEFAULT_CATEGORIES.filter((cat) => !existingSlugs.has(cat.slug));

    if (missing.length === 0) {
      continue;
    }

    await prisma.category.createMany({
      data: missing.map((cat) => ({
        userId: user.id,
        name: cat.name,
        slug: cat.slug,
      })),
    });

    totalCreated += missing.length;
    console.log(
      `User ${user.email ?? user.id}: seeded ${missing.length} categories (${missing
        .map((cat) => cat.slug)
        .join(", ")}).`
    );
  }

  if (totalCreated === 0) {
    console.log("All users already have the default categories. No changes made.");
  } else {
    console.log(`Seeded ${totalCreated} default categories across all users.`);
  }
}

async function main() {
  await seedCategoriesForAllUsers();
}

main()
  .catch((error) => {
    console.error("Failed to seed categories:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
