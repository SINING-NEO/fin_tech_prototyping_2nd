import { NextRequest, NextResponse } from "next/server";
import { isValidRole, ROLE_COOKIE } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  return NextResponse.json({
    role: isValidRole(role) ? role : null,
    authenticated: isValidRole(role),
  });
}
