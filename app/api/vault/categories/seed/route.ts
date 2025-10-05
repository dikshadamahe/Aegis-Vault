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

  // Check if user already has categories
  const existingCount = await prisma.category.count({
    where: { userId: resolvedUserId },
  });

  if (existingCount > 0) {
    return NextResponse.json(
      { error: "User already has categories" },
      { status: 409 }
    );
  }

  // Create default categories
  const created = await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((cat) => ({
      userId: resolvedUserId,
      name: cat.name,
      slug: cat.slug,
    })),
  });

  return NextResponse.json({
    message: `${created.count} default categories created`,
    count: created.count,
  });
}
