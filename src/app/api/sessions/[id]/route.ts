import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerSession,
  updateSessionStatus,
  agentAcceptSession,
  addLiveMessage,
} from "@/lib/session-store";
import type { CustomerSessionStatus } from "@/lib/session-store";
import { isValidRole, ROLE_COOKIE } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getCustomerSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ session });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const body = await request.json();

  if (body.action === "accept") {
    if (!isValidRole(role) || role !== "agent") {
      return NextResponse.json({ error: "Agent access required" }, { status: 403 });
    }
    const session = agentAcceptSession(id);
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session });
  }

  if (body.status) {
    const session = updateSessionStatus(id, body.status as CustomerSessionStatus);
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ session });
  }

  return NextResponse.json({ error: "Invalid update" }, { status: 400 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const role = request.cookies.get(ROLE_COOKIE)?.value;

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const messageRole = body.role === "agent" ? "assistant" : "user";
  if (body.role === "agent" && role !== "agent") {
    return NextResponse.json({ error: "Agent only" }, { status: 403 });
  }

  const session = addLiveMessage(id, {
    id: uuidv4(),
    role: messageRole,
    content: body.content.trim(),
    timestamp: new Date().toISOString(),
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}
