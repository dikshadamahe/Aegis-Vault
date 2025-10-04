import { NextResponse } from "next/server";

export async function GET() {
  // TODO: list categories
  return NextResponse.json({ categories: [] });
}

export async function POST() {
  // TODO: create category
  return NextResponse.json({ ok: true });
}
