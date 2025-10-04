import { NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { z } from "zod";
import crypto from "crypto";

const payloadSchema = z.object({
  email: z.string().email(),
  items: z.array(
    z.object({
      websiteName: z.string().min(1),
      email: z.string().email().optional(),
      username: z.string().optional(),
      url: z.string().url().optional(),
      categorySlug: z.string().min(1),
    })
  ),
});

function b64(bytes: Buffer) {
  return bytes.toString("base64");
}

export async function POST(req: Request) {
  const enabledByEnvVar = process.env.ENABLE_TEST_ENDPOINTS === "1" || process.env.ENABLE_TEST_ENDPOINTS === "true";
  const isProd = process.env.NODE_ENV === "production";
  if (!enabledByEnvVar && isProd) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { email, items } = parsed.data;

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const createdIds: string[] = [];
  for (const it of items) {
    let category = await prisma.category.findFirst({ where: { userId: user.id, slug: it.categorySlug } });
    if (!category) {
      category = await prisma.category.create({ data: { userId: user.id, name: it.categorySlug, slug: it.categorySlug } });
    }
    const nonce = b64(crypto.randomBytes(24));
    const salt = b64(crypto.randomBytes(16));
    const cipher = b64(crypto.randomBytes(32));
    const created = await prisma.password.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        websiteName: it.websiteName.toLowerCase(),
        email: it.email?.toLowerCase(),
        username: it.username?.toLowerCase(),
        url: it.url?.toLowerCase(),
        password: "",
        passwordCiphertext: cipher,
        passwordNonce: nonce,
        passwordSalt: salt,
      },
    });
    createdIds.push(created.id);
  }

  return NextResponse.json({ ok: true, count: createdIds.length, ids: createdIds });
}
