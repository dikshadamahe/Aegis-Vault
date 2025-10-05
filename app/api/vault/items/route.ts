import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth-options";
import prisma from "@/prisma/db";
import { encryptedVaultItemSchema, assertNoPlaintext } from "@/lib/validators/vault-encrypted-schema";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

// GET: list items for current user; supports ?category=&search=
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const pageParam = url.searchParams.get("page");
  const pageSizeParam = url.searchParams.get("pageSize");
  const defaultSize = parseInt(process.env.VAULT_PAGE_SIZE || "10", 10) || 10;
  const pageSize = Math.max(1, Math.min(100, pageSizeParam ? parseInt(pageSizeParam, 10) || defaultSize : defaultSize));
  const page = Math.max(1, pageParam ? parseInt(pageParam, 10) || 1 : 1);

  // Prefer userId from session token (set in callbacks) to avoid an extra DB read
  const userId = (session.user as any).id as string | undefined;
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    resolvedUserId = user.id;
  }

  // Build query with direct ids to avoid $lookup when filtering by category slug
  let categoryId: string | undefined;
  if (category) {
    const cat = await prisma.category.findFirst({
      where: { userId: resolvedUserId, slug: category },
      select: { id: true },
    });
    if (!cat) {
      return NextResponse.json({ items: [], page, pageSize, total: 0, hasPrev: page > 1, hasNext: false });
    }
    categoryId = cat.id;
  }

  const where: any = { userId: resolvedUserId };
  if (categoryId) where.categoryId = categoryId;
  if (search) where.websiteName = { contains: search.toLowerCase() };

  const total = await prisma.password.count({ where });
  const items = await prisma.password.findMany({
    where,
    select: {
      id: true,
      websiteName: true,
      email: true,
      username: true,
      url: true,
      passwordCiphertext: true,
      passwordNonce: true,
      passwordSalt: true,
      notesCiphertext: true,
      notesNonce: true,
      updatedAt: true,
      createdAt: true,
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
      { id: "desc" },
    ],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    hasPrev: page > 1,
    hasNext: page * pageSize < total,
  });
}

// POST: create item (accept ciphertext only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await rateLimit("create:" + session.user.email, 10, 60_000))) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = encryptedVaultItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // reject if plaintext fields accidentally present
  if (!assertNoPlaintext(body)) {
    return NextResponse.json({ error: "Plaintext fields are not allowed" }, { status: 400 });
  }

  const userId = (session.user as any).id as string | undefined;
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    resolvedUserId = user.id;
  }

  const created = await prisma.password.create({
    data: {
      userId: resolvedUserId,
      categoryId: data.category,
      websiteName: data.websiteName.toLowerCase(),
      email: data.email ? data.email.toLowerCase() : undefined,
      username: data.username ? data.username.toLowerCase() : undefined,
      url: data.url ? data.url.toLowerCase() : undefined,
      password: "",
      passwordCiphertext: data.passwordCiphertext,
      passwordNonce: data.passwordNonce,
      passwordSalt: data.passwordSalt,
      notesCiphertext: data.notesCiphertext || undefined,
      notesNonce: data.notesNonce || undefined,
    },
    select: {
      id: true,
      websiteName: true,
      email: true,
      username: true,
      url: true,
      passwordCiphertext: true,
      passwordNonce: true,
      passwordSalt: true,
      notesCiphertext: true,
      notesNonce: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({
    item: created,
  });
}
