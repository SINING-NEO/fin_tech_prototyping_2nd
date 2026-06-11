"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { MessageBubble } from "./MessageBubble";
import { AGENT_QUICK_ACTIONS } from "@/lib/prompts";
import { CATEGORY_LABELS } from "@/lib/knowledge";
import type { ChatMessage, CopilotResponse, CopilotSuggestion } from "@/lib/types";
import type { CustomerLiveSession } from "@/lib/session-store";

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
  waiting_for_agent: "Waiting",
  live_with_agent: "Live",
  ai_chat: "AI chat",
  summary_ready: "Summary",
  closed: "Closed",
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
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>{TYPE_ICONS[suggestion.type]}</span>
          <h4 className="font-medium text-sm text-gray-900">{suggestion.title}</h4>
        </div>
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

export function AgentCopilotWorkspace() {
  const [queue, setQueue] = useState<CustomerLiveSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copilot, setCopilot] = useState<CopilotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentInput, setAgentInput] = useState("");
  const [draftReply, setDraftReply] = useState("");
  const [liveInput, setLiveInput] = useState("");
  const [queueError, setQueueError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = queue.find((s) => s.id === selectedId) ?? null;

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setQueue(data.sessions ?? []);
        setQueueError(null);
        return;
      }
      if (res.status === 403) {
        setQueueError("Agent login required — log in from the landing page with password prudential2025.");
      } else {
        const data = await res.json().catch(() => ({}));
        setQueueError((data as { error?: string }).error ?? `Queue fetch failed (${res.status})`);
      }
    } catch {
      setQueueError("Cannot reach local server — check that npm run dev is running.");
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 2000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.liveMessages]);

  const fetchCopilot = useCallback(
    async (query?: string) => {
      if (!selected) return;
      setLoading(true);
      const transcript: ChatMessage[] = selected.liveMessages.length
        ? selected.liveMessages
        : [
            {
              id: "ctx",
              role: "user",
              content: selected.navigator.concern ?? selected.handoff.customerSummary.needsIdentified.join(". "),
              timestamp: selected.createdAt,
            },
          ];
      try {
        const res = await fetch("/api/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: transcript, agentQuery: query }),
        });
        const data: CopilotResponse = await res.json();
        setCopilot(data);
      } catch {
        setCopilot(null);
      } finally {
        setLoading(false);
      }
    },
    [selected]
  );

  useEffect(() => {
    if (selected) fetchCopilot();
  }, [selected?.id, fetchCopilot]);

  async function acceptCustomer(id: string) {
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    setSelectedId(id);
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

  function applyDraftToLive() {
    if (!draftReply.trim()) return;
    setLiveInput(draftReply);
    setDraftReply("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-3.5rem)]">
      {/* Customer queue */}
      <div className="lg:col-span-3 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 bg-pru-red-light">
          <h2 className="font-semibold text-pru-red-dark text-sm">Customer Queue</h2>
          <p className="text-xs text-gray-500">{queue.length} session(s) · same server</p>
          {queueError && (
            <p className="text-xs text-red-700 mt-1 bg-red-50 border border-red-100 rounded px-2 py-1">
              {queueError}
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 && (
            <p className="p-4 text-xs text-gray-500 leading-relaxed">
              No customers in queue. Open the <strong>Customer portal</strong> in another tab,
              complete the navigator, then click &quot;Chat live with Financial Representative&quot;.
            </p>
          )}
          {queue.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                selectedId === item.id ? "bg-pru-red-light border-l-4 border-l-pru-red" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-pru-gray-dark truncate">{item.customerLabel}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    item.status === "waiting_for_agent"
                      ? "bg-amber-100 text-amber-800"
                      : item.status === "live_with_agent"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 truncate">
                {item.handoff.customerSummary.productsExplored.join(", ") || "No plans yet"}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {new Date(item.updatedAt).toLocaleTimeString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Live chat with selected customer */}
      <div className="lg:col-span-4 border-r border-gray-200 flex flex-col bg-white">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 p-6 text-center">
            Select a customer from the queue to view their summary and chat.
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-sm text-pru-gray-dark">{selected.customerLabel}</h2>
              {selected.status === "waiting_for_agent" && (
                <button type="button" onClick={() => acceptCustomer(selected.id)} className="btn-primary text-xs mt-2">
                  Accept &amp; start live chat
                </button>
              )}
            </div>

            <div className="px-4 py-2 bg-gray-50 border-b text-xs max-h-32 overflow-y-auto">
              <p><strong>Needs:</strong> {selected.handoff.customerSummary.needsIdentified.join(" · ")}</p>
              <p className="mt-1"><strong>Confidence:</strong> {selected.handoff.customerSummary.confidenceLevel}</p>
              <p className="mt-1"><strong>Budget:</strong> {selected.handoff.customerSummary.estimatedBudgetRange}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {selected.liveMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={{
                    ...msg,
                    role: msg.role === "assistant" ? "assistant" : "user",
                  }}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {selected.status === "live_with_agent" && (
              <div className="border-t border-gray-200 p-3 space-y-2">
                <textarea
                  value={draftReply}
                  onChange={(e) => setDraftReply(e.target.value)}
                  rows={2}
                  placeholder="Copilot draft — edit before sending"
                  className="w-full border rounded-lg px-3 py-2 text-xs"
                />
                <div className="flex gap-2">
                  <input
                    value={liveInput}
                    onChange={(e) => setLiveInput(e.target.value)}
                    placeholder="Reply to customer…"
                    className="flex-1 border rounded-full px-3 py-2 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && sendLiveReply()}
                  />
                  <button type="button" onClick={sendLiveReply} className="btn-primary text-sm px-3">
                    Send
                  </button>
                </div>
                {draftReply && (
                  <button type="button" onClick={applyDraftToLive} className="text-xs text-pru-red hover:underline">
                    Use draft in reply →
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Copilot panel */}
      <div className="lg:col-span-5 flex flex-col bg-gray-50">
        <div className="px-4 py-3 border-b border-gray-200 bg-white flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-pru-red-dark text-sm">AI Copilot</h2>
            <p className="text-xs text-gray-500">Powered by customer summary + live context</p>
          </div>
          <button type="button" onClick={() => fetchCopilot()} disabled={loading || !selected} className="btn-secondary text-xs py-1 px-2">
            Refresh
          </button>
        </div>

        <div className="px-4 py-2 border-b bg-white flex flex-wrap gap-1">
          {AGENT_QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => fetchCopilot(action)}
              disabled={!selected}
              className="text-[10px] border border-gray-200 px-2 py-1 rounded-full hover:border-pru-red disabled:opacity-40"
            >
              {action}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!selected && <p className="text-sm text-gray-500">Select a customer to activate copilot.</p>}
          {loading && <p className="text-sm text-gray-500">Analyzing…</p>}
          {copilot?.suggestions?.map((s, i) => (
            <SuggestionCard key={`${s.type}-${i}`} suggestion={s} onUse={(c) => setDraftReply(c)} />
          ))}
          {selected && (
            <div className="copilot-card text-xs">
              <h4 className="font-medium">Full handoff summary</h4>
              <p className="mt-2 text-gray-600"><strong>Demographics:</strong> {selected.handoff.demographics.ageRange}, {selected.handoff.demographics.familySituation}</p>
              <p className="mt-1 text-gray-600"><strong>Plans:</strong> {selected.handoff.plansConsidered.map((p) => p.name).join(", ")}</p>
              <p className="mt-1 text-gray-600"><strong>Outstanding:</strong> {selected.handoff.outstandingQuestions.join("; ") || "None"}</p>
            </div>
          )}
        </div>

        <div className="border-t bg-white p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchCopilot(agentInput);
              setAgentInput("");
            }}
            className="flex gap-2"
          >
            <input
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              placeholder="Ask copilot about this customer…"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              disabled={!selected}
            />
            <button type="submit" className="btn-primary text-sm" disabled={!selected}>
              Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
