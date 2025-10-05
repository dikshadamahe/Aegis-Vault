import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth-options";
import prisma from "@/prisma/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = ((session.user as any).id as string | undefined) ?? null;
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    resolvedUserId = user.id;
  }

  const url = new URL(req.url);
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const where: any = { userId: resolvedUserId };
  if (category) {
    const cat = await prisma.category.findFirst({ where: { userId: resolvedUserId, slug: category }, select: { id: true } });
    if (!cat) return NextResponse.json({ total: 0 });
    where.categoryId = cat.id;
  }
  if (search) where.websiteName = { contains: search.toLowerCase() };

  const total = await prisma.password.count({ where });
  return NextResponse.json({ total });
}
