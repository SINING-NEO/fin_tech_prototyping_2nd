import { Redis } from "@upstash/redis";
import type { ChatMessage } from "../types";
import type { FrHandoffDocument, NavigatorSession } from "../navigator/types";
import type { CustomerLiveSession, CustomerSessionStatus } from "./types";

const SESSION_INDEX = "pru:sessions:index";

function sessionKey(id: string): string {
  return `pru:session:${id}`;
}

function getRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error("Redis is not configured");
  }

  return new Redis({ url, token });
}

function customerLabel(nav: NavigatorSession): string {
  const age = nav.profile.ageRange ?? "Customer";
  const type = nav.insuranceType ?? nav.topIntent ?? "Inquiry";
  const concern = nav.concern?.slice(0, 30) ?? "General";
  return `${age} · ${type} · ${concern}${nav.concern && nav.concern.length > 30 ? "…" : ""}`;
}

async function saveSession(redis: Redis, record: CustomerLiveSession): Promise<void> {
  await redis.set(sessionKey(record.id), record);
  await redis.zadd(SESSION_INDEX, {
    score: new Date(record.updatedAt).getTime(),
    member: record.id,
  });
}

export async function upsertCustomerSession(
  navigator: NavigatorSession,
  handoff: FrHandoffDocument,
  status: CustomerSessionStatus = "summary_ready"
): Promise<CustomerLiveSession> {
  const redis = getRedisClient();
  const existing = await redis.get<CustomerLiveSession>(sessionKey(navigator.id));
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

  await saveSession(redis, record);
  return record;
}

export async function getCustomerSession(id: string): Promise<CustomerLiveSession | undefined> {
  const redis = getRedisClient();
  const session = await redis.get<CustomerLiveSession>(sessionKey(id));
  return session ?? undefined;
}

export async function listCustomerSessions(): Promise<CustomerLiveSession[]> {
  const redis = getRedisClient();
  const ids = await redis.zrange<string[]>(SESSION_INDEX, 0, -1, { rev: true });
  if (!ids.length) return [];

  const sessions = await Promise.all(
    ids.map((id) => redis.get<CustomerLiveSession>(sessionKey(id)))
  );

  return sessions.filter((s): s is CustomerLiveSession => s !== null);
}

export async function updateSessionStatus(
  id: string,
  status: CustomerSessionStatus
): Promise<CustomerLiveSession | undefined> {
  const redis = getRedisClient();
  const session = await redis.get<CustomerLiveSession>(sessionKey(id));
  if (!session) return undefined;

  session.status = status;
  session.updatedAt = new Date().toISOString();
  await saveSession(redis, session);
  return session;
}

export async function addLiveMessage(
  id: string,
  message: ChatMessage
): Promise<CustomerLiveSession | undefined> {
  const redis = getRedisClient();
  const session = await redis.get<CustomerLiveSession>(sessionKey(id));
  if (!session) return undefined;

  session.liveMessages.push(message);
  session.updatedAt = new Date().toISOString();
  await saveSession(redis, session);
  return session;
}

export async function agentAcceptSession(id: string): Promise<CustomerLiveSession | undefined> {
  const redis = getRedisClient();
  const session = await redis.get<CustomerLiveSession>(sessionKey(id));
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

  await saveSession(redis, session);
  return session;
}

export async function closeSessionWithSummary(
  id: string,
  postMeetingSummary: import("../navigator/types").PostMeetingSummary
): Promise<CustomerLiveSession | undefined> {
  const redis = getRedisClient();
  const session = await redis.get<CustomerLiveSession>(sessionKey(id));
  if (!session) return undefined;
  session.status = "closed";
  session.postMeetingSummary = postMeetingSummary;
  session.updatedAt = new Date().toISOString();
  await saveSession(redis, session);
  return session;
}
