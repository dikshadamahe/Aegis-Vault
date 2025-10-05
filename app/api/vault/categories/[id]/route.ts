import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth-options";
import prisma from "@/prisma/db";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  if (!name) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  const userId = ((session.user as any).id as string | undefined) ?? null;
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    resolvedUserId = user.id;
  }

  const existing = await prisma.category.findFirst({ where: { id: params.id, userId: resolvedUserId } });
  if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const updated = await prisma.category.update({ where: { id: existing.id }, data: { name }, select: { id: true, name: true, slug: true } });
  return NextResponse.json({ category: updated });
}

export async function DELETE(_: Request, { params }: Params) {
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
  // ensure the category belongs to user
  const existing = await prisma.category.findFirst({ where: { id: params.id, userId: resolvedUserId } });
  if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  await prisma.category.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
