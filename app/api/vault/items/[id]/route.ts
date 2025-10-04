import { NextResponse } from "next/server";

export async function GET() {
  // TODO: return a single item
  return NextResponse.json({ item: null });
}

export async function PATCH() {
  // TODO: update an item
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  // TODO: delete an item
  return NextResponse.json({ ok: true });
}
