import { PrismaClient } from "@prisma/client";

// Ensure a database name exists in the Mongo connection string for Prisma.
// Prisma requires a DB name in the URI path, e.g., mongodb+srv://.../mydb
// If it's missing, we default it in dev/test to avoid initialization errors.
(() => {
  const key = "MONGODB_URI";
  const raw = process.env[key];
  if (!raw) return;
  try {
    if (/^mongodb(\+srv)?:\/\//i.test(raw)) {
      const url = new URL(raw);
      const hasDb = url.pathname && url.pathname !== "/" && url.pathname.length > 1;
      if (!hasDb) {
        // Choose a sensible default db name
        url.pathname = "/vaultmvp";
        // Helpful defaults
        if (!url.searchParams.has("retryWrites")) url.searchParams.set("retryWrites", "true");
        if (!url.searchParams.has("w")) url.searchParams.set("w", "majority");
        process.env[key] = url.toString();
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("[prisma] MONGODB_URI had no database name; defaulting to:", url.pathname.slice(1));
        }
      }
    }
  } catch {
    // ignore parse errors; let Prisma surface the original error
  }
})();

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
