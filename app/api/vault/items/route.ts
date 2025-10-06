import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth-options";
import prisma from "@/prisma/db";
import { Prisma } from "@prisma/client";
import { encryptedVaultItemSchema, assertNoPlaintext } from "@/lib/validators/vault-encrypted-schema";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

// GET: list items for current user; supports ?category=&search=
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
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

  const where: any = { userId: resolvedUserId };
  if (search) {
    const lookup = search.toLowerCase();
    where.OR = [
      { websiteName: { contains: lookup, mode: "insensitive" } },
      { username: { contains: lookup, mode: "insensitive" } },
      { email: { contains: lookup, mode: "insensitive" } },
    ];
  }

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
      passwordEncryptedDek: true,
      passwordDekNonce: true,
      notesCiphertext: true,
      notesNonce: true,
      notesEncryptedDek: true,
      notesDekNonce: true,
      passwordSalt: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      updatedAt: true,
      createdAt: true,
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

  const createData: Prisma.PasswordCreateInput = {
    password: "",
    websiteName: data.websiteName,
    email: data.email ?? null,
    username: data.username ?? null,
    url: data.url ?? null,
    passwordCiphertext: data.passwordCiphertext,
    passwordNonce: data.passwordNonce,
    passwordEncryptedDek: data.passwordEncryptedDek,
    passwordDekNonce: data.passwordDekNonce,
    passwordSalt: data.passwordSalt ?? null,
    notesCiphertext: data.notesCiphertext ?? null,
    notesNonce: data.notesNonce ?? null,
    notesEncryptedDek: data.notesEncryptedDek ?? null,
    notesDekNonce: data.notesDekNonce ?? null,
    user: {
      connect: { id: resolvedUserId },
    },
    category: undefined,
  };

  if (data.categoryId) {
    createData.category = {
      connect: { id: data.categoryId },
    };
  }

  const created = await prisma.password.create({
    data: createData,
    select: {
      id: true,
      websiteName: true,
      email: true,
      username: true,
      url: true,
      passwordCiphertext: true,
      passwordNonce: true,
      passwordEncryptedDek: true,
      passwordDekNonce: true,
      notesCiphertext: true,
      notesNonce: true,
      notesEncryptedDek: true,
      notesDekNonce: true,
      passwordSalt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    item: created,
  });
}
