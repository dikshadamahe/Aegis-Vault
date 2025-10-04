import { NextResponse } from "next/server";

export async function POST() {
  // TODO: validate options and generate password on server if used
  return NextResponse.json({ password: "" });
}
