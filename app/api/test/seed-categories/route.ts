import { NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { z } from "zod";

const payloadSchema = z.object({
  email: z.string().email(),
  categories: z
    .array(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).optional(),
      })
    )
    .default([{ name: "Web Logins", slug: "web-logins" }]),
});

export async function POST(req: Request) {
  const enabledByEnvVar = process.env.ENABLE_TEST_ENDPOINTS === "1" || process.env.ENABLE_TEST_ENDPOINTS === "true";
  const isProd = process.env.NODE_ENV === "production";
  if (!enabledByEnvVar && isProd) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { email, categories } = parsed.data;

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ensured: { id: string; name: string; slug: string }[] = [];
  for (const c of categories) {
    const slug = (c.slug || c.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const existing = await prisma.category.findFirst({ where: { userId: user.id, slug } });
    if (existing) {
      ensured.push({ id: existing.id, name: existing.name, slug: existing.slug });
    } else {
      const created = await prisma.category.create({ data: { userId: user.id, name: c.name, slug } });
      ensured.push({ id: created.id, name: created.name, slug: created.slug });
    }
  }

  return NextResponse.json({ ok: true, categories: ensured });
}
