import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidRole, ROLE_COOKIE } from "@/lib/auth";

const AGENT_PREFIX = "/agent";
const LOGIN_PATH = "/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(ROLE_COOKIE)?.value;

  if (pathname.startsWith(AGENT_PREFIX)) {
    if (!isValidRole(role) || role !== "agent") {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      loginUrl.searchParams.set("portal", "agent");
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname === LOGIN_PATH && role === "agent") {
    return NextResponse.redirect(new URL("/agent", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/agent/:path*", "/login"],
};
