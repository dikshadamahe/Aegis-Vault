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
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const pageParam = url.searchParams.get("page");
  const pageSizeParam = url.searchParams.get("pageSize");
  const defaultSize = parseInt(process.env.VAULT_PAGE_SIZE || "10", 10) || 10;
  const pageSize = Math.max(1, Math.min(100, pageSizeParam ? parseInt(pageSizeParam, 10) || defaultSize : defaultSize));
  const page = Math.max(1, pageParam ? parseInt(pageParam, 10) || 1 : 1);

  const user = await prisma.user.findFirst({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where: any = { userId: user.id };
  if (category) where.category = { slug: category };
  if (search) where.websiteName = { contains: search };

  const total = await prisma.password.count({ where });
  const items = await prisma.password.findMany({
    where,
    include: { category: true },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Do not return legacy plaintext password
  const sanitized = items.map((i: any) => ({
    id: i.id,
    websiteName: i.websiteName,
    email: i.email,
    username: i.username,
    url: i.url,
    category: i.category,
    passwordCiphertext: i.passwordCiphertext,
    passwordNonce: i.passwordNonce,
    passwordSalt: i.passwordSalt,
    notesCiphertext: i.notesCiphertext,
    notesNonce: i.notesNonce,
    updatedAt: i.updatedAt,
    createdAt: i.createdAt,
  }));

  return NextResponse.json({
    items: sanitized,
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
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const user = await prisma.user.findFirst({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const created = await prisma.password.create({
    data: {
      userId: user.id,
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
    include: { category: true },
  });

  return NextResponse.json({
    item: {
      id: created.id,
      websiteName: created.websiteName,
      email: created.email,
      username: created.username,
      url: created.url,
      category: created.category,
      passwordCiphertext: created.passwordCiphertext,
      passwordNonce: created.passwordNonce,
      passwordSalt: created.passwordSalt,
      notesCiphertext: created.notesCiphertext,
      notesNonce: created.notesNonce,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    },
  });
}
