import { NextResponse } from "next/server";
import prisma from "@/prisma/db";

export async function GET() {
  try {
    // Perform a trivial query to verify Prisma<->DB connectivity
    await prisma.user.findFirst();
    return NextResponse.json({ status: "ok" });
  } catch (e: any) {
    console.error("[health/db] prisma connectivity error:", e);
    return NextResponse.json(
      { status: "error", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
