import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidPassword, SESSION_COOKIE, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: "" }));
  if (!isValidPassword(String(password || ""))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, signSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true });
}
