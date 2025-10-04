import { NextResponse } from "next/server";
import prisma from "@/prisma/db";
import bcrypt from "bcrypt";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const enabledByEnvVar = process.env.ENABLE_TEST_ENDPOINTS === "1" || process.env.ENABLE_TEST_ENDPOINTS === "true";
  const isProd = process.env.NODE_ENV === "production";
  if (!enabledByEnvVar && isProd) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { email, username, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { name: username }] } });
  if (existing) return NextResponse.json({ ok: true, userId: existing.id });

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  const created = await prisma.user.create({ data: { email, name: username, hashedPassword } });
  return NextResponse.json({ ok: true, userId: created.id });
}
