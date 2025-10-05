import { NextResponse } from "next/server";
import { generatePasswordSchema } from "@/lib/validators/generate-password-schema";
import generator from "generate-password";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = generatePasswordSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { length, lowercase, uppercase, digits, specialCharacters } = parsed.data;
    const password = generator.generate({ length, lowercase, uppercase, numbers: digits, symbols: specialCharacters });
    return NextResponse.json({ password });
  } catch (e) {
    console.error("[api/generate-password] error", e);
    return NextResponse.json({ error: "Failed to generate password" }, { status: 500 });
  }
}
