import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth-options";
import prisma from "@/prisma/db";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = ((session.user as any).id as string | undefined) ?? null;
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    resolvedUserId = user.id;
  }

  const categories = await prisma.category.findMany({
    where: { userId: resolvedUserId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return NextResponse.json({ categories });
}

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = ((session.user as any).id as string | undefined) ?? null;
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    resolvedUserId = user.id;
  }

  const body = await req.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { name } = parsed.data;
  const slug = (parsed.data.slug || name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const existing = await prisma.category.findFirst({ where: { userId: resolvedUserId, slug } });
  if (existing) return NextResponse.json({ error: "Category already exists" }, { status: 409 });

  const created = await prisma.category.create({
    data: { userId: resolvedUserId, name, slug },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ category: created });
}
