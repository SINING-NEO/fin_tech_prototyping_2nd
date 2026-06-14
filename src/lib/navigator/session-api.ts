import type { NavigatorSession, FrHandoffDocument } from "./types";
import type { ChatMessage } from "../types";
import type { CustomerSessionStatus } from "../session-store";
const SESSION_ID_KEY = "pru_customer_session_id";

export function saveCustomerSessionId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_ID_KEY, id);
}

export function getCustomerSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

export async function syncCustomerSession(
  navigator: NavigatorSession,
  status: CustomerSessionStatus
): Promise<{ session: { id: string; handoff: FrHandoffDocument } } | { error: string }> {
  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ navigator, status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const apiError = (data as { error?: string }).error;
      if (res.status === 503 && apiError) {
        return { error: apiError };
      }
      return { error: apiError ?? `Sync failed (${res.status})` };
    }
    const data = await res.json();
    saveCustomerSessionId(navigator.id);
    return data;
  } catch {
    return { error: "Could not reach local server" };
  }
}

export async function syncAiChatMessages(
  sessionId: string,
  aiChatMessages: ChatMessage[]
): Promise<boolean> {
  try {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_ai_chat", aiChatMessages }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function requestAgentChat(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "waiting_for_agent" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
