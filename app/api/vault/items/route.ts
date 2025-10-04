import { NextResponse } from "next/server";

// GET: list items (pagination, search via query params)
export async function GET() {
  // TODO: implement using Prisma once business logic is added
  return NextResponse.json({ items: [] });
}

// POST: create new vault item (expects ciphertext)
export async function POST() {
  // TODO: implement create flow with validation
  return NextResponse.json({ ok: true });
}
