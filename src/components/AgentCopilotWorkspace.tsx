"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { RepBriefingPanel } from "./navigator/RepBriefingPanel";
import { PostMeetingSummaryPanel } from "./navigator/PostMeetingSummaryPanel";
import { AgentCopilotChat } from "./AgentCopilotChat";
import { StoreSetupBanner } from "./StoreSetupBanner";
import type { CustomerLiveSession } from "@/lib/session-store";

type AgentView = "briefing" | "live" | "post_meeting";
type RightPanelTab = "rep_desk" | "session_chat" | "customer_dash";
type MobilePanel = "queue" | "main" | "copilot";

const STATUS_LABELS: Record<string, string> = {
  waiting_for_agent: "Awaiting rep",
  live_with_agent: "Live",
  ai_chat: "AI chat",
  summary_ready: "Intake ready",
  closed: "Completed",
};

function detectLiveSignals(messages: { role: string; content: string }[]): string[] {
  const text = messages.filter((m) => m.role === "user").map((m) => m.content).join(" ").toLowerCase();
  const signals: string[] = [];
  if (/expensive|afford|cost|worth|price/.test(text)) signals.push("Objection: value / affordability — suggest scenario-based hospitalisation example");
  if (/confus|don't understand|not sure|unclear/.test(text)) signals.push("Sentiment: confused — simplify explanation, use analogy");
  if (/rider|addon|add-on/.test(text)) signals.push("Topic: riders — compare add-on protection layers");
  if (/exclude|claim|cover/.test(text)) signals.push("Topic: coverage scope — policy consistency check recommended");
  if (messages.filter((m) => m.role === "user").length > 0 && !/budget|afford|premium/.test(text)) {
    signals.push("Missing info: budget not discussed yet — prompt comparison moment");
  }
  return signals;
}

export function AgentCopilotWorkspace() {
  const [queue, setQueue] = useState<CustomerLiveSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sessionLookup, setSessionLookup] = useState("");
  const [draftReply, setDraftReply] = useState("");
  const [liveInput, setLiveInput] = useState("");
  const [queueError, setQueueError] = useState<string | null>(null);
  const [agentView, setAgentView] = useState<AgentView>("briefing");
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>("rep_desk");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("queue");
  const [storeWarning, setStoreWarning] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = queue.find((s) => s.id === selectedId) ?? null;
  const liveSignals = selected ? detectLiveSignals(selected.liveMessages) : [];

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setQueue(data.sessions ?? []);
        setStoreWarning((data as { storeWarning?: string }).storeWarning ?? null);
        setQueueError(null);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setQueueError("Agent login required — log in from the landing page with password prudential2025.");
      } else if (res.status === 503) {
        setQueueError((data as { error?: string }).error ?? "Add Upstash Redis env vars on Vercel and redeploy.");
      } else {
        setQueueError((data as { error?: string }).error ?? `Queue fetch failed (${res.status})`);
      }
    } catch {
      setQueueError("Cannot reach server — check that the app is running.");
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 2000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  useEffect(() => {
    if (!selected) return;
    if (selected.status === "closed") setAgentView("post_meeting");
    else if (selected.status === "live_with_agent") setAgentView("live");
    else setAgentView("briefing");
  }, [selected?.id, selected?.status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.liveMessages]);

  async function lookupSession() {
    const id = sessionLookup.trim();
    if (!id) return;
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedId(data.session.id);
        setQueue((q) => (q.some((s) => s.id === data.session.id) ? q : [data.session, ...q]));
        if (data.session.status !== "live_with_agent" && data.session.status !== "closed") {
          setRightPanelTab("customer_dash");
        }
        setMobilePanel("main");
      }
    } catch {
      /* ignore */
    }
  }

  async function acceptCustomer(id: string) {
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    setSelectedId(id);
    setAgentView("live");
    setRightPanelTab("customer_dash");
    setMobilePanel("main");
    await fetchQueue();
  }

  async function endMeeting() {
    if (!selected) return;
    await fetch(`/api/sessions/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end_meeting" }),
    });
    setAgentView("post_meeting");
    await fetchQueue();
  }

  async function sendLiveReply() {
    if (!selected || !liveInput.trim()) return;
    const text = liveInput.trim();
    setLiveInput("");
    await fetch(`/api/sessions/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, role: "agent" }),
    });
    await fetchQueue();
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {queueError && (
        <div className="flex-shrink-0 px-3 py-2 lg:px-4 border-b border-amber-100 bg-amber-50/80">
          <StoreSetupBanner message={queueError} compact />
        </div>
      )}
      {storeWarning && !queueError && (
        <div className="flex-shrink-0 px-3 py-2 text-[11px] text-amber-800 bg-amber-50 border-b border-amber-100">
          {storeWarning}
        </div>
      )}

      <div className="flex-1 min-h-0 h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
      <div className={`${mobilePanel === "queue" ? "flex" : "hidden"} lg:flex lg:col-span-3 h-full max-h-full border-r border-gray-200 bg-white flex-col min-h-0 overflow-hidden`}>
        <div className="px-4 py-3 border-b border-gray-200 bg-pru-red-light">
          <h2 className="font-semibold text-pru-red-dark text-sm">Consultation queue</h2>
          <p className="text-xs text-gray-500">{queue.length} intake(s)</p>
        </div>

        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
          <p className="text-[10px] font-medium text-gray-500 mb-1">Load by Session ID</p>
          <div className="flex gap-1">
            <input
              value={sessionLookup}
              onChange={(e) => setSessionLookup(e.target.value)}
              placeholder="Paste session ID…"
              className="flex-1 text-xs border rounded px-2 py-1.5 font-mono"
            />
            <button type="button" onClick={() => void lookupSession()} className="text-xs bg-pru-gray-dark text-white px-2 rounded">
              Load
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 && (
            <p className="p-4 text-xs text-gray-500 leading-relaxed">
              No consultations yet. Customer completes the guided intake form and books a session.
            </p>
          )}
          {queue.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedId(item.id);
                setMobilePanel("main");
                if (item.status !== "live_with_agent" && item.status !== "closed") {
                  setRightPanelTab("customer_dash");
                }
              }}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                selectedId === item.id ? "bg-pru-red-light border-l-4 border-l-pru-red" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium truncate">{item.customerLabel}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100">{STATUS_LABELS[item.status] ?? item.status}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono mt-1">{item.id.slice(0, 8)}…</p>
            </button>
          ))}
        </div>
      </div>

      <div className={`${mobilePanel === "main" ? "flex" : "hidden"} lg:flex lg:col-span-5 h-full max-h-full border-r border-gray-200 flex-col bg-white min-h-0 overflow-hidden`}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 p-6 text-center">
            Select a consultation or enter a Session ID to load the pre-meeting brief.
          </div>
        ) : agentView === "post_meeting" && selected.postMeetingSummary ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <PostMeetingSummaryPanel summary={selected.postMeetingSummary} sessionId={selected.id} role="agent" />
          </div>
        ) : agentView === "briefing" ? (
          <div className="flex-1 min-h-0 h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 h-0 overflow-y-auto overscroll-contain p-4">
              <RepBriefingPanel handoff={selected.handoff} products={selected.navigator.matchedProducts} sessionId={selected.id} embedded />
            </div>
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
              <button type="button" onClick={() => void acceptCustomer(selected.id)} className="btn-primary text-sm w-full">
                Start live consultation →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-200 bg-green-50 flex-shrink-0">
              <p className="text-[10px] font-medium text-green-800 uppercase">Step 3 · Live consultation</p>
              <h2 className="font-semibold text-sm">{selected.customerLabel}</h2>
              <button type="button" onClick={() => void endMeeting()} className="mt-2 text-xs border border-green-700 text-green-800 px-3 py-1 rounded-full hover:bg-green-100">
                End consultation &amp; generate summary
              </button>
            </div>

            {liveSignals.length > 0 && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs space-y-1 flex-shrink-0">
                <p className="font-medium text-amber-900">Live signals</p>
                {liveSignals.map((s) => (
                  <p key={s} className="text-amber-800">→ {s}</p>
                ))}
              </div>
            )}

            <div className="flex-1 min-h-0 h-0 overflow-y-auto overscroll-contain px-4 py-3">
              {selected.liveMessages.map((msg) => (
                <MessageBubble key={msg.id} message={{ ...msg, role: msg.role === "assistant" ? "assistant" : "user" }} />
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-200 p-3 space-y-2 flex-shrink-0">
              <textarea value={draftReply} onChange={(e) => setDraftReply(e.target.value)} rows={2} placeholder="Copilot draft — edit before sending" className="w-full border rounded-lg px-3 py-2 text-xs" />
              <div className="flex gap-2">
                <input value={liveInput} onChange={(e) => setLiveInput(e.target.value)} placeholder="Reply to customer…" className="flex-1 border rounded-full px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && sendLiveReply()} />
                <button type="button" onClick={() => void sendLiveReply()} className="btn-primary text-sm px-3">Send</button>
              </div>
              {draftReply && (
                <button type="button" onClick={() => { setLiveInput(draftReply); setDraftReply(""); }} className="text-xs text-pru-red hover:underline">
                  Use draft in reply →
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className={`${mobilePanel === "copilot" ? "flex" : "hidden"} lg:flex lg:col-span-4 h-full max-h-full flex-col bg-gray-50 min-h-0 overflow-hidden`}>
        <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-semibold text-pru-red-dark text-sm">AI Copilot</h2>
              <p className="text-xs text-gray-500 truncate">Rep desk, live assist, or customer brief</p>
            </div>
          </div>
          <div className="mt-2 flex gap-1 p-0.5 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setRightPanelTab("rep_desk")}
              className={`flex-1 text-[10px] sm:text-xs py-1.5 rounded-md font-medium transition-colors ${
                rightPanelTab === "rep_desk"
                  ? "bg-white text-pru-red shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Rep Desk
            </button>
            <button
              type="button"
              onClick={() => setRightPanelTab("session_chat")}
              className={`flex-1 text-[10px] sm:text-xs py-1.5 rounded-md font-medium transition-colors ${
                rightPanelTab === "session_chat"
                  ? "bg-white text-pru-red shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Live Assist
            </button>
            <button
              type="button"
              onClick={() => setRightPanelTab("customer_dash")}
              className={`flex-1 text-[10px] sm:text-xs py-1.5 rounded-md font-medium transition-colors ${
                rightPanelTab === "customer_dash"
                  ? "bg-white text-pru-red shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Customer Dash
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 h-0 overflow-hidden flex flex-col">
          {rightPanelTab === "rep_desk" ? (
            <div className="flex-1 min-h-0 h-0 overflow-hidden">
              <AgentCopilotChat mode="general" onUseDraft={(text) => setDraftReply(text)} />
            </div>
          ) : rightPanelTab === "session_chat" ? (
            selected ? (
              <div className="flex-1 min-h-0 h-0 overflow-hidden">
                <AgentCopilotChat
                  mode="session"
                  handoff={selected.handoff}
                  customerLabel={selected.customerLabel}
                  liveTranscript={selected.liveMessages ?? []}
                  onUseDraft={(text) => setDraftReply(text)}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center text-xs text-gray-500 gap-3">
                <p>Select a consultation from the queue to use Live Assist with that customer&apos;s brief and transcript.</p>
                <button
                  type="button"
                  onClick={() => setRightPanelTab("rep_desk")}
                  className="text-pru-red hover:underline"
                >
                  Use Rep Desk for general questions →
                </button>
              </div>
            )
          ) : selected ? (
            <div className="flex-1 min-h-0 h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 h-0 overflow-y-auto overscroll-contain p-4">
                <RepBriefingPanel
                  handoff={selected.handoff}
                  products={selected.navigator.matchedProducts}
                  sessionId={selected.id}
                  embedded
                />
              </div>
              {agentView === "briefing" && (
                <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
                  <button
                    type="button"
                    onClick={() => void acceptCustomer(selected.id)}
                    className="btn-primary text-sm w-full"
                  >
                    Start live consultation →
                  </button>
                  <p className="text-[10px] text-gray-500 text-center mt-2">
                    Accepts the customer and opens live chat in the centre panel
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex items-center justify-center p-6 text-center text-xs text-gray-500">
              Select a consultation to view the customer brief dashboard.
            </div>
          )}
        </div>
      </div>
      </div>

      <nav className="lg:hidden flex-shrink-0 grid grid-cols-3 border-t border-gray-200 bg-white safe-area-pb">
        {(
          [
            { id: "queue" as const, label: "Queue" },
            { id: "main" as const, label: "Session" },
            { id: "copilot" as const, label: "Copilot" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobilePanel(id)}
            className={`py-3 text-xs font-medium transition-colors ${
              mobilePanel === id
                ? "text-pru-red border-t-2 border-pru-red bg-pru-red-light/40"
                : "text-gray-500 border-t-2 border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
