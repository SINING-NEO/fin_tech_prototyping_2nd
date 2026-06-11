import fs from "fs";
import path from "path";
import type { ChatMessage } from "./types";
import type { FrHandoffDocument, NavigatorSession } from "./navigator/types";
import { buildHandoffDocument } from "./navigator/engine";

export type CustomerSessionStatus =
  | "summary_ready"
  | "ai_chat"
  | "waiting_for_agent"
  | "live_with_agent"
  | "closed";

export interface CustomerLiveSession {
  id: string;
  status: CustomerSessionStatus;
  handoff: FrHandoffDocument;
  navigator: NavigatorSession;
  liveMessages: ChatMessage[];
  customerLabel: string;
  createdAt: string;
  updatedAt: string;
}

const STORE_FILE = path.join(process.cwd(), ".demo-sessions.json");

type StoreFile = { sessions: Record<string, CustomerLiveSession> };

declare global {
  // eslint-disable-next-line no-var
  var __pruSessions: Map<string, CustomerLiveSession> | undefined;
}

function loadSessions(): Map<string, CustomerLiveSession> {
  if (global.__pruSessions) {
    return global.__pruSessions;
  }

  const map = new Map<string, CustomerLiveSession>();
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf8");
      const data = JSON.parse(raw) as StoreFile;
      for (const [id, session] of Object.entries(data.sessions ?? {})) {
        map.set(id, session);
      }
    }
  } catch {
    // Start with an empty store if the file is missing or corrupt.
  }

  global.__pruSessions = map;
  return map;
}

function persistSessions(map: Map<string, CustomerLiveSession>): void {
  try {
    const data: StoreFile = { sessions: Object.fromEntries(map) };
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[session-store] Failed to persist sessions:", err);
  }
}

const sessions = loadSessions();

function customerLabel(nav: NavigatorSession): string {
  const age = nav.profile.ageRange ?? "Customer";
  const type = nav.insuranceType ?? nav.topIntent ?? "Inquiry";
  const concern = nav.concern?.slice(0, 30) ?? "General";
  return `${age} · ${type} · ${concern}${nav.concern && nav.concern.length > 30 ? "…" : ""}`;
}

export function upsertCustomerSession(
  navigator: NavigatorSession,
  handoff: FrHandoffDocument,
  status: CustomerSessionStatus = "summary_ready"
): CustomerLiveSession {
  const existing = sessions.get(navigator.id);
  const now = new Date().toISOString();

  const record: CustomerLiveSession = {
    id: navigator.id,
    status: existing?.status === "live_with_agent" ? existing.status : status,
    handoff,
    navigator,
    liveMessages: existing?.liveMessages ?? [],
    customerLabel: customerLabel(navigator),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  sessions.set(navigator.id, record);
  persistSessions(sessions);
  return record;
}

export function getCustomerSession(id: string): CustomerLiveSession | undefined {
  return sessions.get(id);
}

export function listCustomerSessions(): CustomerLiveSession[] {
  return Array.from(sessions.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function updateSessionStatus(
  id: string,
  status: CustomerSessionStatus
): CustomerLiveSession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  session.status = status;
  session.updatedAt = new Date().toISOString();
  persistSessions(sessions);
  return session;
}

export function addLiveMessage(
  id: string,
  message: ChatMessage
): CustomerLiveSession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  session.liveMessages.push(message);
  session.updatedAt = new Date().toISOString();
  persistSessions(sessions);
  return session;
}

export function agentAcceptSession(id: string): CustomerLiveSession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;

  session.status = "live_with_agent";
  session.updatedAt = new Date().toISOString();

  if (session.liveMessages.length === 0) {
    session.liveMessages.push({
      id: `fr-welcome-${Date.now()}`,
      role: "assistant",
      content:
        "Hello! I'm your Financial Representative. I've reviewed your session summary and I'm here to help. What would you like to discuss?",
      timestamp: new Date().toISOString(),
    });
  }

  persistSessions(sessions);
  return session;
}

/** Seed demo queue for agent portal when empty */
export function seedDemoSessionsIfEmpty(): void {
  if (sessions.size > 0) return;

  const demoNavigators: Partial<NavigatorSession>[] = [
    {
      id: "demo-001",
      insuranceType: "Health",
      concern: "I'm worried about hospital bills",
      profile: { ageRange: "36-45", familySituation: "Married with children", budgetPreference: "Balanced" },
      matchedProducts: [],
      confidenceLevel: "somewhat",
      wantsFrHelp: true,
    },
    {
      id: "demo-002",
      insuranceType: "Life",
      concern: "I want to protect my family",
      profile: { ageRange: "26-35", familySituation: "Married, no children", budgetPreference: "Budget-conscious" },
      matchedProducts: [],
      confidenceLevel: "confident",
      wantsFrHelp: true,
    },
  ];

  for (const partial of demoNavigators) {
    const nav = {
      step: "summary" as const,
      profile: partial.profile ?? {},
      matchedProducts: [],
      questionsAsked: [],
      remainingConcerns: [],
      wantsFrHelp: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...partial,
    } as NavigatorSession;

    const handoff = buildHandoffDocument(nav);
    const record = upsertCustomerSession(nav, handoff, "waiting_for_agent");
    record.customerLabel = partial.concern?.slice(0, 40) ?? record.customerLabel;
  }
}
