import { NextResponse } from "next/server";
import prisma from "@/prisma/db";
import bcrypt from "bcrypt";
import { z } from "zod";

const payloadSchema = z.object({
  email: z.string().email(),
  username: z.string().optional(),
  password: z.string().optional(),
  categories: z
    .array(z.object({ name: z.string().min(1), slug: z.string().optional() }))
    .optional(),
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
  const { email, username, password, categories } = parsed.data;

  // defaults
  const defaultPassword = password || "Password!123";
  const defaultUsername = username || email.split("@")[0];
  const defaultCategories = (
    categories && categories.length ? categories : [{ name: "Web Logins", slug: "web-logins" }]
  ).map((c) => ({
    name: c.name,
    slug: (c.slug || c.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
  }));

  // ensure user
  let user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);
    user = await prisma.user.create({ data: { email, name: defaultUsername, hashedPassword } });
  }

  // ensure categories
  let ensuredCount = 0;
  for (const c of defaultCategories) {
    const existing = await prisma.category.findFirst({ where: { userId: user.id, slug: c.slug } });
    if (!existing) {
      await prisma.category.create({ data: { userId: user.id, name: c.name, slug: c.slug } });
    }
    ensuredCount++;
  }

  // clear items
  const del = await prisma.password.deleteMany({ where: { userId: user.id } });

  return NextResponse.json({ ok: true, userId: user.id, categoriesEnsured: ensuredCount, itemsCleared: del.count });
}
