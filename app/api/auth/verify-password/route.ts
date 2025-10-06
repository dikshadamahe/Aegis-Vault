import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth-options";
import prisma from "@/prisma/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null as unknown);
  const password =
    body && typeof body === "object" && typeof (body as { password?: unknown }).password === "string"
      ? (body as { password: string }).password
      : null;

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const userId = (session.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hashedPassword: true },
  });

  if (!user?.hashedPassword) {
    return NextResponse.json({ verified: false });
  }

  const matches = await bcrypt.compare(password, user.hashedPassword);

  return NextResponse.json({ verified: matches });
}
