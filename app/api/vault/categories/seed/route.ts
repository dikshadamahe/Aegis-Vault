import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth-options";
import prisma from "@/prisma/db";

const DEFAULT_CATEGORIES = [
  { name: "Web Logins", slug: "web-logins" },
  { name: "Bank Accounts", slug: "bank-accounts" },
  { name: "Credit Cards", slug: "credit-cards" },
  { name: "Email Accounts", slug: "email-accounts" },
  { name: "Social Media Accounts", slug: "social-media-accounts" },
  { name: "Identity Documents", slug: "identity-documents" },
  { name: "Wifi Passwords", slug: "wifi-passwords" },
  { name: "Notes", slug: "notes" },
  { name: "Others", slug: "others" },
];

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = ((session.user as any).id as string | undefined) ?? null;
  let resolvedUserId = userId;
  
  if (!resolvedUserId) {
    if (!session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    resolvedUserId = user.id;
  }

  const userIdForQuery = resolvedUserId as string;

  const existing = await prisma.category.findMany({
    where: { userId: userIdForQuery },
    select: { slug: true },
  });

  const existingSlugs = new Set(existing.map((category) => category.slug));
  const toCreate = DEFAULT_CATEGORIES.filter((cat) => !existingSlugs.has(cat.slug));

  if (toCreate.length > 0) {
    await Promise.all(
      toCreate.map((cat) =>
        prisma.category.create({
          data: {
            userId: userIdForQuery,
            name: cat.name,
            slug: cat.slug,
          },
        })
      )
    );
  }

  const categories = await prisma.category.findMany({
    where: { userId: userIdForQuery },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({
    message:
      toCreate.length > 0
        ? `${toCreate.length} default categories added.`
        : "All default categories were already present.",
    added: toCreate.length,
    categories,
  });
}
