import { PrismaClient } from "@prisma/client";
import { spawnSync } from "child_process";

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
let embeddedUri: string | null = null;
if (
  process.env.NODE_ENV !== "production" &&
  (process.env.ENABLE_EMBEDDED_MONGO === "true" || process.env.ENABLE_EMBEDDED_MONGO === "1")
) {
  try {
    const script = "const { MongoMemoryServer } = require('mongodb-memory-server');(async()=>{const m=await MongoMemoryServer.create({ instance: { port: 27017 } });process.stdout.write(m.getUri());})();";
    const result = spawnSync(process.execPath, ["-e", script], { encoding: "utf-8" });
    if (result.status === 0 && result.stdout) {
      const uri = new URL(result.stdout.trim());
      if (!uri.pathname || uri.pathname === "/") uri.pathname = "/vaultmvp";
      embeddedUri = uri.toString();
      // Force Prisma and any other consumers to use the embedded URI
      process.env.MONGODB_URI = embeddedUri;
      // eslint-disable-next-line no-console
      console.warn("[prisma] Using embedded MongoDB:", embeddedUri);
    } else if (result.stderr) {
      // eslint-disable-next-line no-console
      console.error("[prisma] Embedded MongoDB failed:", result.stderr);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[prisma] Failed to spawn embedded MongoDB:", err);
  }
}

const prismaClientSingleton = () => {
  const urlOverride = embeddedUri || process.env.MONGODB_URI;
  if (urlOverride) {
    return new PrismaClient({ datasources: { db: { url: urlOverride } } });
  }
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
