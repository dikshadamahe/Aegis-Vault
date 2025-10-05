import { NextResponse } from "next/server";
import prisma from "@/prisma/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  try {
    // Prefer a very cheap ping using $queryRaw when supported by Mongo connector
    // Falls back to a trivial read query
    try {
      await (prisma as any).$runCommandRaw?.({ ping: 1 });
    } catch {
      await prisma.user.findFirst();
    }
    const payload: any = { status: "ok" };
    if (debug) {
      const uri = process.env.MONGODB_URI || "";
      payload.meta = {
        connectionType: /mongodb\+srv:\/\//i.test(uri) ? "srv" : "standard",
        hostPreview: (() => {
          try {
            const u = new URL(uri);
            return u.hostname || null;
          } catch {
            return null;
          }
        })(),
      };
    }
    return NextResponse.json(payload);
  } catch (e: any) {
    console.error("[health/db] prisma connectivity error:", e);
    const payload: any = { status: "error", message: e?.message || String(e) };
    if (debug) {
      const uri = process.env.MONGODB_URI || "";
      payload.meta = {
        connectionType: /mongodb\+srv:\/\//i.test(uri) ? "srv" : "standard",
        hostPreview: (() => {
          try {
            const u = new URL(uri);
            return u.hostname || null;
          } catch {
            return null;
          }
        })(),
      };
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
