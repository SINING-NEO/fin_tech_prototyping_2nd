import { NextRequest, NextResponse } from "next/server";
import { getAgentDemoPassword, ROLE_COOKIE, AUTH_COOKIE, type UserRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = body.role as UserRole;
    const password = body.password as string | undefined;

    if (role !== "customer" && role !== "agent") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (role === "agent") {
      const expected = getAgentDemoPassword();
      if (!password || password !== expected) {
        return NextResponse.json({ error: "Invalid agent credentials" }, { status: 401 });
      }
    }

    const response = NextResponse.json({
      ok: true,
      role,
      redirect: role === "agent" ? "/agent" : "/chat",
    });

    response.cookies.set(ROLE_COOKIE, role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    response.cookies.set(AUTH_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
