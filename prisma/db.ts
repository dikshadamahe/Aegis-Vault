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

// Optional: Start an embedded MongoDB for tests/dev when network is unavailable.
// This allows Playwright/Vitest to run without external MongoDB.
declare global {
  // eslint-disable-next-line no-var
  var __mongoMemoryServer: any | undefined;
}

if (
  (process.env.ENABLE_EMBEDDED_MONGO === "1" || process.env.ENABLE_EMBEDDED_MONGO === "true") &&
  process.env.NODE_ENV !== "production"
) {
  const ensureEmbeddedMongo = async () => {
    if (!globalThis.__mongoMemoryServer) {
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const mms = await MongoMemoryServer.create({ instance: { dbName: "vaultmvp" } });
        globalThis.__mongoMemoryServer = mms;
        const uri = mms.getUri();
        // set Prisma connection string to embedded instance
        process.env.MONGODB_URI = uri;
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("[prisma] Using embedded MongoDB for development/tests:", uri);
        }
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("[prisma] ENABLE_EMBEDDED_MONGO requested but mongodb-memory-server not installed or failed to start. Falling back to MONGODB_URI.");
        }
      }
    }
  };
  // Top-level await is supported in Next.js server modules
  await ensureEmbeddedMongo();
}

const prismaClientSingleton = () => {
  // if embedded mongo is enabled, we best-effort initialize it synchronously via a cached promise
  const shouldEmbed = (process.env.ENABLE_EMBEDDED_MONGO === "1" || process.env.ENABLE_EMBEDDED_MONGO === "true") && process.env.NODE_ENV !== "production";
  if (shouldEmbed && !globalThis.__mongoMemoryServer) {
    // Fire and forget, Prisma will retry connections under the hood
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const mms = await MongoMemoryServer.create({ instance: { dbName: "vaultmvp" } });
        globalThis.__mongoMemoryServer = mms;
        process.env.MONGODB_URI = mms.getUri();
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("[prisma] Using embedded MongoDB for development/tests:", process.env.MONGODB_URI);
        }
      } catch {
        // ignore; fallback to external MONGODB_URI
      }
    })();
  }
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
