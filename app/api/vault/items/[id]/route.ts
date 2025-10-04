import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth-options";
import prisma from "@/prisma/db";
import { encryptedVaultItemSchema, assertNoPlaintext } from "@/lib/validators/vault-encrypted-schema";
import { rateLimit } from "@/lib/rate-limit";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findFirst({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.password.findFirst({ where: { id: params.id, userId: user.id }, include: { category: true } });
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
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const sessionUser = await prisma.user.findFirst({ where: { email: session.user.email } });
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.password.findFirst({ where: { id: params.id, userId: sessionUser.id } });
  if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const updated = await prisma.password.update({
    where: { id: existing.id },
    data: {
      categoryId: data.category,
      websiteName: data.websiteName.toLowerCase(),
      email: data.email ? data.email.toLowerCase() : undefined,
      username: data.username ? data.username.toLowerCase() : undefined,
      url: data.url ? data.url.toLowerCase() : undefined,
      password: "",
      passwordCiphertext: data.passwordCiphertext,
      passwordNonce: data.passwordNonce,
      passwordSalt: data.passwordSalt, // new salt per update
      notesCiphertext: data.notesCiphertext || undefined,
      notesNonce: data.notesNonce || undefined,
    },
    include: { category: true },
  });

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
      passwordSalt: updated.passwordSalt,
      notesCiphertext: updated.notesCiphertext,
      notesNonce: updated.notesNonce,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await rateLimit("delete:" + session.user.email, 10, 60_000))) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const user = await prisma.user.findFirst({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.password.findFirst({ where: { id: params.id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  await prisma.password.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
