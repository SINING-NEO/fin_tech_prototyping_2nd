import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerSession,
  updateSessionStatus,
  agentAcceptSession,
  addLiveMessage,
  closeSessionWithSummary,
  getSessionStoreMode,
  getSessionStoreError,
} from "@/lib/session-store";
import { buildPostMeetingSummary } from "@/lib/navigator/engine";
import type { CustomerSessionStatus } from "@/lib/session-store";
import { isValidRole, ROLE_COOKIE } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const storeError = getSessionStoreError();
  if (storeError) {
    return NextResponse.json({ error: storeError, storeMode: getSessionStoreMode() }, { status: 503 });
  }

  try {
    const session = await getCustomerSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ session, storeMode: getSessionStoreMode() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load session";
    return NextResponse.json({ error: message, storeMode: getSessionStoreMode() }, { status: 503 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const storeError = getSessionStoreError();
  if (storeError) {
    return NextResponse.json({ error: storeError, storeMode: getSessionStoreMode() }, { status: 503 });
  }

  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const body = await request.json();

  try {
    if (body.action === "accept") {
      if (!isValidRole(role) || role !== "agent") {
        return NextResponse.json({ error: "Agent access required" }, { status: 403 });
      }
      const session = await agentAcceptSession(id);
      if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ session, storeMode: getSessionStoreMode() });
    }

    if (body.action === "end_meeting") {
      if (!isValidRole(role) || role !== "agent") {
        return NextResponse.json({ error: "Agent access required" }, { status: 403 });
      }
      const existing = await getCustomerSession(id);
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const summary = buildPostMeetingSummary(existing.navigator, existing.liveMessages);
      const session = await closeSessionWithSummary(id, summary);
      if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ session, storeMode: getSessionStoreMode() });
    }

    if (body.status) {
      const session = await updateSessionStatus(id, body.status as CustomerSessionStatus);
      if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ session, storeMode: getSessionStoreMode() });
    }

    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update session";
    return NextResponse.json({ error: message, storeMode: getSessionStoreMode() }, { status: 503 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const storeError = getSessionStoreError();
  if (storeError) {
    return NextResponse.json({ error: storeError, storeMode: getSessionStoreMode() }, { status: 503 });
  }

  const body = await request.json();
  const role = request.cookies.get(ROLE_COOKIE)?.value;

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const messageRole = body.role === "agent" ? "assistant" : "user";
  if (body.role === "agent" && role !== "agent") {
    return NextResponse.json({ error: "Agent only" }, { status: 403 });
  }

  try {
    const session = await addLiveMessage(id, {
      id: uuidv4(),
      role: messageRole,
      content: body.content.trim(),
      timestamp: new Date().toISOString(),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session, storeMode: getSessionStoreMode() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send message";
    return NextResponse.json({ error: message, storeMode: getSessionStoreMode() }, { status: 503 });
  }
}
