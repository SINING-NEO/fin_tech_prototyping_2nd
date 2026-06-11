import { NextRequest, NextResponse } from "next/server";
import {
  listCustomerSessions,
  upsertCustomerSession,
} from "@/lib/session-store";
import { buildHandoffDocument } from "@/lib/navigator/engine";
import type { CustomerSessionStatus } from "@/lib/session-store";
import { isValidRole, ROLE_COOKIE } from "@/lib/auth";
import type { NavigatorSession as NavSession } from "@/lib/navigator/types";

export async function GET(request: NextRequest) {
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  if (!isValidRole(role) || role !== "agent") {
    return NextResponse.json({ error: "Agent access required" }, { status: 403 });
  }

  const sessions = listCustomerSessions();
  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      status: s.status,
      customerLabel: s.customerLabel,
      handoff: s.handoff,
      navigator: s.navigator,
      liveMessages: s.liveMessages,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const navigator = body.navigator as NavSession;
    const status = (body.status as CustomerSessionStatus) ?? "summary_ready";

    if (!navigator?.id) {
      return NextResponse.json({ error: "Navigator session required" }, { status: 400 });
    }

    const handoff = buildHandoffDocument(navigator);
    const session = upsertCustomerSession(navigator, handoff, status);

    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
