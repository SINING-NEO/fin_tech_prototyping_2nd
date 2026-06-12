"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { RepBriefingPanel } from "./navigator/RepBriefingPanel";
import { PostMeetingSummaryPanel } from "./navigator/PostMeetingSummaryPanel";
import { AGENT_QUICK_ACTIONS } from "@/lib/prompts";
import type { ChatMessage, CopilotResponse, CopilotSuggestion } from "@/lib/types";
import type { CustomerLiveSession } from "@/lib/session-store";

type AgentView = "briefing" | "live" | "post_meeting";

const PRIORITY_STYLES: Record<string, string> = {
  high: "border-l-4 border-l-red-500",
  medium: "border-l-4 border-l-amber-400",
  low: "border-l-4 border-l-gray-300",
};

const TYPE_ICONS: Record<CopilotSuggestion["type"], string> = {
  response_draft: "💬",
  next_action: "➡️",
  knowledge: "📚",
  compliance: "⚠️",
  summary: "📋",
  plain_language: "📝",
  suitability: "🎯",
};

const STATUS_LABELS: Record<string, string> = {
  waiting_for_agent: "Awaiting rep",
  live_with_agent: "Live",
  summary_ready: "Intake ready",
  closed: "Completed",
};

function SuggestionCard({
  suggestion,
  onUse,
}: {
  suggestion: CopilotSuggestion;
  onUse?: (content: string) => void;
}) {
  return (
    <div className={`copilot-card ${PRIORITY_STYLES[suggestion.priority]}`}>
      <div className="flex items-center gap-2">
        <span>{TYPE_ICONS[suggestion.type]}</span>
        <h4 className="font-medium text-sm text-gray-900">{suggestion.title}</h4>
      </div>
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{suggestion.content}</p>
      {suggestion.type === "response_draft" && onUse && (
        <button type="button" onClick={() => onUse(suggestion.content)} className="mt-3 text-xs text-pru-red font-medium hover:underline">
          Copy to reply →
        </button>
      )}
    </div>
  );
}

function detectLiveSignals(messages: ChatMessage[]): string[] {
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
  const [copilot, setCopilot] = useState<CopilotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentInput, setAgentInput] = useState("");
  const [draftReply, setDraftReply] = useState("");
  const [liveInput, setLiveInput] = useState("");
  const [queueError, setQueueError] = useState<string | null>(null);
  const [agentView, setAgentView] = useState<AgentView>("briefing");
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = queue.find((s) => s.id === selectedId) ?? null;
  const liveSignals = selected ? detectLiveSignals(selected.liveMessages) : [];

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setQueue(data.sessions ?? []);
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

  const fetchCopilot = useCallback(
    async (query?: string) => {
      if (!selected) return;
      setLoading(true);
      const transcript: ChatMessage[] = selected.liveMessages.length
        ? selected.liveMessages
        : [{ id: "ctx", role: "user", content: selected.handoff.customerSummary.needsIdentified.join(". "), timestamp: selected.createdAt }];
      try {
        const res = await fetch("/api/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: transcript,
            agentQuery: query,
            sessionContext: {
              handoff: selected.handoff,
              status: selected.status,
            },
          }),
        });
        setCopilot(await res.json());
      } catch {
        setCopilot(null);
      } finally {
        setLoading(false);
      }
    },
    [selected]
  );

  useEffect(() => {
    if (selected && agentView === "live") fetchCopilot();
  }, [selected?.id, agentView, fetchCopilot]);

  async function lookupSession() {
    const id = sessionLookup.trim();
    if (!id) return;
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedId(data.session.id);
        setQueue((q) => (q.some((s) => s.id === data.session.id) ? q : [data.session, ...q]));
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-3.5rem)]">
      {/* Queue + session lookup */}
      <div className="lg:col-span-3 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 bg-pru-red-light">
          <h2 className="font-semibold text-pru-red-dark text-sm">Consultation queue</h2>
          <p className="text-xs text-gray-500">{queue.length} intake(s)</p>
          {queueError && <p className="text-xs text-red-700 mt-1 bg-red-50 border border-red-100 rounded px-2 py-1">{queueError}</p>}
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
              No consultations yet. Customer completes the <strong>guided intake form</strong> and books a session.
            </p>
          )}
          {queue.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
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

      {/* Main panel: briefing / live / post */}
      <div className="lg:col-span-5 border-r border-gray-200 flex flex-col bg-white">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 p-6 text-center">
            Select a consultation or enter a Session ID to load the pre-meeting brief.
          </div>
        ) : agentView === "post_meeting" && selected.postMeetingSummary ? (
          <div className="flex-1 overflow-y-auto p-4">
            <PostMeetingSummaryPanel summary={selected.postMeetingSummary} sessionId={selected.id} role="agent" />
          </div>
        ) : agentView === "briefing" ? (
          <div className="flex-1 overflow-y-auto p-4">
            <RepBriefingPanel
              handoff={selected.handoff}
              products={selected.navigator.matchedProducts}
              sessionId={selected.id}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => acceptCustomer(selected.id)} className="btn-primary text-sm flex-1">
                Start live consultation →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-200 bg-green-50">
              <p className="text-[10px] font-medium text-green-800 uppercase">Step 3 · Live consultation assistant</p>
              <h2 className="font-semibold text-sm">{selected.customerLabel}</h2>
              <p className="text-[10px] text-green-700 mt-1">Real-time transcription analysis — AI supports clearer consultations</p>
              <button type="button" onClick={() => void endMeeting()} className="mt-2 text-xs border border-green-700 text-green-800 px-3 py-1 rounded-full hover:bg-green-100">
                End consultation &amp; generate summary
              </button>
            </div>

            {liveSignals.length > 0 && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs space-y-1">
                <p className="font-medium text-amber-900">Live signals</p>
                {liveSignals.map((s) => (
                  <p key={s} className="text-amber-800">→ {s}</p>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {selected.liveMessages.map((msg) => (
                <MessageBubble key={msg.id} message={{ ...msg, role: msg.role === "assistant" ? "assistant" : "user" }} />
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-200 p-3 space-y-2">
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

      {/* Copilot panel */}
      <div className="lg:col-span-4 flex flex-col bg-gray-50">
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <h2 className="font-semibold text-pru-red-dark text-sm">AI Copilot</h2>
          <p className="text-xs text-gray-500">Supports financial reps — does not replace advice</p>
        </div>

        <div className="px-4 py-2 border-b bg-white flex flex-wrap gap-1">
          {AGENT_QUICK_ACTIONS.map((action) => (
            <button key={action} type="button" onClick={() => fetchCopilot(action)} disabled={!selected} className="text-[10px] border border-gray-200 px-2 py-1 rounded-full hover:border-pru-red disabled:opacity-40">
              {action}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!selected && <p className="text-sm text-gray-500">Select a consultation to activate copilot.</p>}
          {loading && <p className="text-sm text-gray-500">Analyzing conversation…</p>}
          {copilot?.suggestions?.map((s, i) => (
            <SuggestionCard key={`${s.type}-${i}`} suggestion={s} onUse={(c) => setDraftReply(c)} />
          ))}
          {selected?.status === "live_with_agent" && (
            <div className="copilot-card text-xs border-l-4 border-l-amber-400">
              <h4 className="font-medium">Policy consistency checker</h4>
              <p className="mt-1 text-gray-600">Cross-check explanations against policy documents. Flag oversimplifications before the customer leaves.</p>
            </div>
          )}
        </div>

        <div className="border-t bg-white p-3">
          <form onSubmit={(e) => { e.preventDefault(); fetchCopilot(agentInput); setAgentInput(""); }} className="flex gap-2">
            <input value={agentInput} onChange={(e) => setAgentInput(e.target.value)} placeholder="Ask copilot…" className="flex-1 border rounded-lg px-3 py-2 text-sm" disabled={!selected} />
            <button type="submit" className="btn-primary text-sm" disabled={!selected}>Ask</button>
          </form>
        </div>
      </div>
    </div>
  );
}
