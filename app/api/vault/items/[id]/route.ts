import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth-options";
import prisma from "@/prisma/db";
import { Prisma } from "@prisma/client";
import { encryptedVaultItemSchema, assertNoPlaintext } from "@/lib/validators/vault-encrypted-schema";
import { rateLimit } from "@/lib/rate-limit";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = ((session.user as any).id as string | undefined) ?? null;
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    resolvedUserId = u.id;
  }

  const item = await prisma.password.findFirst({
    where: { id: params.id, userId: resolvedUserId },
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
  if (!item) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  return NextResponse.json({
    item: {
      id: item.id,
      websiteName: item.websiteName,
      email: item.email,
      username: item.username,
      url: item.url,
      category: item.category,
      passwordCiphertext: item.passwordCiphertext,
      passwordNonce: item.passwordNonce,
      passwordSalt: item.passwordSalt,
      notesCiphertext: item.notesCiphertext,
      notesNonce: item.notesNonce,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    },
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await rateLimit("update:" + session.user.email, 10, 60_000))) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = encryptedVaultItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // forbid plaintext
  if (!assertNoPlaintext(body)) {
    return NextResponse.json({ error: "Plaintext fields are not allowed" }, { status: 400 });
  }

  const userId = ((session.user as any).id as string | undefined) ?? null;
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    resolvedUserId = u.id;
  }

  const existing = await prisma.password.findFirst({ where: { id: params.id, userId: resolvedUserId } });
  if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  // Ensure target category belongs to the same user
  let nextCategoryId: string | null | undefined = undefined;
  if (data.categoryId !== undefined) {
    if (data.categoryId) {
      const targetCategory = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: resolvedUserId },
        select: { id: true },
      });
      if (!targetCategory) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      nextCategoryId = targetCategory.id;
    } else {
      nextCategoryId = null;
    }
  }

  const updateData: Prisma.PasswordUncheckedUpdateInput = {
    websiteName: data.websiteName,
    password: "",
    passwordCiphertext: data.passwordCiphertext,
    passwordNonce: data.passwordNonce,
    passwordEncryptedDek: data.passwordEncryptedDek,
    passwordDekNonce: data.passwordDekNonce,
    passwordSalt: data.passwordSalt ?? null,
    notesCiphertext: data.notesCiphertext ?? null,
    notesNonce: data.notesNonce ?? null,
    notesEncryptedDek: data.notesEncryptedDek ?? null,
    notesDekNonce: data.notesDekNonce ?? null,
  };

  if (data.email !== undefined) {
    updateData.email = data.email || null;
  }

  if (data.username !== undefined) {
    updateData.username = data.username || null;
  }

  if (data.url !== undefined) {
    updateData.url = data.url || null;
  }

  if (typeof nextCategoryId === "string") {
    updateData.categoryId = nextCategoryId;
  }

  const passwordSelect = {
    id: true,
    websiteName: true,
    email: true,
    username: true,
    url: true,
    passwordCiphertext: true,
    passwordNonce: true,
    passwordEncryptedDek: true,
    passwordDekNonce: true,
    passwordSalt: true,
    notesCiphertext: true,
    notesNonce: true,
    notesEncryptedDek: true,
    notesDekNonce: true,
    createdAt: true,
    updatedAt: true,
    category: { select: { id: true, name: true, slug: true } },
  } as const;

  type PasswordPayload = Prisma.PasswordGetPayload<{ select: typeof passwordSelect }>;

  const updated = await prisma.password.update({
    where: { id: existing.id },
    data: updateData,
    select: passwordSelect,
  }) as PasswordPayload;

  return NextResponse.json({
    item: {
      id: updated.id,
      websiteName: updated.websiteName,
      email: updated.email,
      username: updated.username,
      url: updated.url,
      category: updated.category,
      passwordCiphertext: updated.passwordCiphertext,
      passwordNonce: updated.passwordNonce,
      passwordEncryptedDek: updated.passwordEncryptedDek,
      passwordDekNonce: updated.passwordDekNonce,
      passwordSalt: updated.passwordSalt,
      notesCiphertext: updated.notesCiphertext,
      notesNonce: updated.notesNonce,
      notesEncryptedDek: updated.notesEncryptedDek,
      notesDekNonce: updated.notesDekNonce,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await rateLimit("delete:" + session.user.email, 10, 60_000))) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const userId = ((session.user as any).id as string | undefined) ?? null;
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    if (!session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    resolvedUserId = u.id;
  }

  const existing = await prisma.password.findFirst({ where: { id: params.id, userId: resolvedUserId } });
  if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  await prisma.password.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
