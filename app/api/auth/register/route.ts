import { NextResponse } from "next/server";
import prisma from "@/prisma/db";
import bcrypt from "bcrypt";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { randomBytes } from "crypto";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { email, username, password } = parsed.data;

    const emailLower = email.trim().toLowerCase();
    const usernameLower = username.trim().toLowerCase();

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const encryptionSalt = randomBytes(16).toString("base64");

    if (process.env.NODE_ENV === "development") {
      console.log("[REGISTER] Generated salt for new user:", encryptionSalt);
    }

    const created = await prisma.user.create({
      data: {
        email: emailLower,
        name: usernameLower,
        hashedPassword,
        encryptionSalt,
      },
    });

    return NextResponse.json({ ok: true, userId: created.id }, { status: 201 });
  } catch (err: any) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta as any)?.target?.[0] || "field";
      return NextResponse.json({ error: `The ${target} is already in use.` }, { status: 409 });
    }
    console.error("[api/auth/register] error", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}


