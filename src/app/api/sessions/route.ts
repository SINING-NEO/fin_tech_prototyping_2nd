import { NextRequest, NextResponse } from "next/server";
import {
  listCustomerSessions,
  upsertCustomerSession,
  getSessionStoreMode,
  getSessionStoreError,
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

  const storeError = getSessionStoreError();
  if (storeError) {
    return NextResponse.json({ error: storeError, storeMode: getSessionStoreMode() }, { status: 503 });
  }

  try {
    const sessions = await listCustomerSessions();
    return NextResponse.json({
      storeMode: getSessionStoreMode(),
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load sessions";
    return NextResponse.json({ error: message, storeMode: getSessionStoreMode() }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const storeError = getSessionStoreError();
  if (storeError) {
    return NextResponse.json({ error: storeError, storeMode: getSessionStoreMode() }, { status: 503 });
  }

  try {
    const body = await request.json();
    const navigator = body.navigator as NavSession;
    const status = (body.status as CustomerSessionStatus) ?? "summary_ready";

    if (!navigator?.id) {
      return NextResponse.json({ error: "Navigator session required" }, { status: 400 });
    }

    const handoff = buildHandoffDocument(navigator);
    const session = await upsertCustomerSession(navigator, handoff, status);

    return NextResponse.json({ session, storeMode: getSessionStoreMode() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save session";
    return NextResponse.json({ error: message, storeMode: getSessionStoreMode() }, { status: 503 });
  }
}
