import { NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { z } from "zod";

const payloadSchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const enabledByEnvVar = process.env.ENABLE_TEST_ENDPOINTS === "1" || process.env.ENABLE_TEST_ENDPOINTS === "true";
  const isProd = process.env.NODE_ENV === "production";
  if (!enabledByEnvVar && isProd) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { email } = parsed.data;

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.password.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
