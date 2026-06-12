import type { ChatMessage } from "../types";
import type { FrHandoffDocument, NavigatorSession } from "../navigator/types";

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
  postMeetingSummary?: import("../navigator/types").PostMeetingSummary;
  createdAt: string;
  updatedAt: string;
}

export type SessionStoreMode = "redis" | "file" | "unavailable";
