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

// Optional embedded MongoDB for local/dev and CI e2e
// If enabled and the configured URI is missing or uses SRV, spin up an in-memory Mongo
// to avoid external DNS/egress issues.
if (
  process.env.NODE_ENV !== "production" &&
  (process.env.ENABLE_EMBEDDED_MONGO === "true" || process.env.ENABLE_EMBEDDED_MONGO === "1")
) {
  const current = process.env.MONGODB_URI || "";
  const shouldStartEmbedded = !current || /^mongodb\+srv:\/\//i.test(current);
  if (shouldStartEmbedded) {
    // Lazy init to avoid import cost during build
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const mongod = await MongoMemoryServer.create();
        // Provide a stable db name in the URI path
        const uri = new URL(mongod.getUri());
        if (!uri.pathname || uri.pathname === "/") uri.pathname = "/vaultmvp";
        process.env.MONGODB_URI = uri.toString();
        // eslint-disable-next-line no-console
        console.warn("[prisma] Using embedded MongoDB for development:", process.env.MONGODB_URI);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[prisma] Failed to start embedded MongoDB:", err);
      }
    })();
  }
}

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
