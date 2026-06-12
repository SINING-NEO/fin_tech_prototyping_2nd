import type { ChatMessage } from "../types";
import type { FrHandoffDocument, NavigatorSession } from "../navigator/types";
import * as memoryStore from "./memory";
import * as redisStore from "./redis";
import type { CustomerLiveSession, CustomerSessionStatus, SessionStoreMode } from "./types";
import type { PostMeetingSummary } from "../navigator/types";

export type { CustomerLiveSession, CustomerSessionStatus, SessionStoreMode } from "./types";

const VERCEL_DEPLOYED = process.env.VERCEL === "1";

function hasRedisConfig(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return Boolean(url && token);
}

export function getSessionStoreMode(): SessionStoreMode {
  if (hasRedisConfig()) return "redis";
  if (VERCEL_DEPLOYED) return "unavailable";
  return "file";
}

export function getSessionStoreError(): string | null {
  if (getSessionStoreMode() !== "unavailable") return null;
  return (
    "Live customer–agent sync requires Redis on Vercel. " +
    "Add a free Upstash Redis database and set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Vercel env vars."
  );
}

function assertStoreAvailable(): void {
  const error = getSessionStoreError();
  if (error) {
    throw new Error(error);
  }
}

export async function upsertCustomerSession(
  navigator: NavigatorSession,
  handoff: FrHandoffDocument,
  status: CustomerSessionStatus = "summary_ready"
): Promise<CustomerLiveSession> {
  assertStoreAvailable();
  if (hasRedisConfig()) {
    return redisStore.upsertCustomerSession(navigator, handoff, status);
  }
  return memoryStore.upsertCustomerSession(navigator, handoff, status);
}

export async function getCustomerSession(id: string): Promise<CustomerLiveSession | undefined> {
  assertStoreAvailable();
  if (hasRedisConfig()) {
    return redisStore.getCustomerSession(id);
  }
  return memoryStore.getCustomerSession(id);
}

export async function listCustomerSessions(): Promise<CustomerLiveSession[]> {
  assertStoreAvailable();
  if (hasRedisConfig()) {
    return redisStore.listCustomerSessions();
  }
  return memoryStore.listCustomerSessions();
}

export async function updateSessionStatus(
  id: string,
  status: CustomerSessionStatus
): Promise<CustomerLiveSession | undefined> {
  assertStoreAvailable();
  if (hasRedisConfig()) {
    return redisStore.updateSessionStatus(id, status);
  }
  return memoryStore.updateSessionStatus(id, status);
}

export async function addLiveMessage(
  id: string,
  message: ChatMessage
): Promise<CustomerLiveSession | undefined> {
  assertStoreAvailable();
  if (hasRedisConfig()) {
    return redisStore.addLiveMessage(id, message);
  }
  return memoryStore.addLiveMessage(id, message);
}

export async function agentAcceptSession(id: string): Promise<CustomerLiveSession | undefined> {
  assertStoreAvailable();
  if (hasRedisConfig()) {
    return redisStore.agentAcceptSession(id);
  }
  return memoryStore.agentAcceptSession(id);
}

export async function closeSessionWithSummary(
  id: string,
  postMeetingSummary: PostMeetingSummary
): Promise<CustomerLiveSession | undefined> {
  assertStoreAvailable();
  if (hasRedisConfig()) {
    return redisStore.closeSessionWithSummary(id, postMeetingSummary);
  }
  return memoryStore.closeSessionWithSummary(id, postMeetingSummary);
}

export async function seedDemoSessionsIfEmpty(): Promise<void> {
  assertStoreAvailable();
  if (hasRedisConfig()) {
    const existing = await redisStore.listCustomerSessions();
    if (existing.length > 0) return;
    // Redis seeding omitted — real customer sessions are preferred for demos.
    return;
  }
  memoryStore.seedDemoSessionsIfEmpty();
}
