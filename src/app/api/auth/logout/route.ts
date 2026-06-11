import { NextResponse } from "next/server";
import { AUTH_COOKIE, ROLE_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ROLE_COOKIE);
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
