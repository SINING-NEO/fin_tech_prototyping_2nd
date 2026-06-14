"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { AGENT_QUICK_ACTIONS } from "@/lib/prompts";
import type { ChatMessage, CopilotResponse, CopilotSuggestion } from "@/lib/types";
import type { FrHandoffDocument } from "@/lib/navigator/types";

const WELCOME: ChatMessage = {
  id: "copilot-welcome",
  role: "assistant",
  content:
    "I'm your AI Copilot. Ask me anything about this customer — talking points, plain-language explanations, policy consistency checks, or what to say next.\n\nI support your consultation; I don't replace suitability advice.",
  timestamp: new Date().toISOString(),
};

function formatCopilotReply(response: CopilotResponse, query: string): string {
  const parts: string[] = [];
  const draft = response.suggestions.find((s) => s.type === "response_draft");
  if (draft) parts.push(draft.content);

  const rest = response.suggestions.filter(
    (s) => s.type !== "response_draft" && s.type !== "summary" && s.priority !== "low"
  );
  for (const s of rest.slice(0, 3)) {
    parts.push(`${s.title}: ${s.content}`);
  }

  if (parts.length === 0) {
    parts.push(response.suggestions[0]?.content ?? "Review the suggestions below for this situation.");
  }

  if (response.customerSentiment) {
    parts.push(`\nCustomer sentiment: ${response.customerSentiment}.`);
  }

  return parts.join("\n\n");
}

interface AgentCopilotChatProps {
  handoff?: FrHandoffDocument;
  customerLabel?: string;
  liveTranscript?: ChatMessage[];
  onUseDraft?: (text: string) => void;
}

export function AgentCopilotChat({
  handoff,
  customerLabel,
  liveTranscript = [],
  onUseDraft,
}: AgentCopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [lastSuggestions, setLastSuggestions] = useState<CopilotSuggestion[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (handoff && customerLabel) {
      setMessages([
        {
          id: "ctx-welcome",
          role: "assistant",
          content: `Loaded brief for ${customerLabel}. Direction: ${handoff.customerInsight?.recommendedDirection ?? "See handoff"}. Ask me how to explain plans, handle objections, or draft replies.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [handoff?.sessionId, customerLabel]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setLastSuggestions([]);

    const contextMessages: ChatMessage[] =
      liveTranscript.length > 0
        ? liveTranscript
        : handoff
          ? [
              {
                id: "handoff-ctx",
                role: "user",
                content: handoff.customerSummary.needsIdentified.join(". "),
                timestamp: new Date().toISOString(),
              },
            ]
          : [];

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...contextMessages, ...updated.filter((m) => m.id !== "copilot-welcome" && m.id !== "ctx-welcome")],
          agentQuery: text.trim(),
          handoff,
        }),
      });
      const data: CopilotResponse = await res.json();
      const reply = formatCopilotReply(data, text);
      setLastSuggestions(data.suggestions ?? []);

      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "Copilot is temporarily unavailable. Use the pre-meeting brief and policy consistency checker.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={{
              ...msg,
              role: msg.role === "user" ? "user" : "assistant",
            }}
            compact
          />
        ))}
        {loading && <TypingIndicator compact />}
        <div ref={bottomRef} />
      </div>

      {lastSuggestions.length > 0 && !loading && (
        <div className="px-3 pb-2 space-y-1 max-h-32 overflow-y-auto">
          {lastSuggestions
            .filter((s) => s.type === "response_draft" || s.type === "compliance")
            .map((s) => (
              <button
                key={`${s.type}-${s.title}`}
                type="button"
                onClick={() => onUseDraft?.(s.content)}
                className="block w-full text-left text-[10px] bg-white border border-gray-200 rounded-lg px-2 py-1.5 hover:border-pru-red"
              >
                <span className="font-medium text-pru-red">{s.title}</span>
                <span className="text-gray-600"> — copy to customer reply</span>
              </button>
            ))}
        </div>
      )}

      <div className="px-3 pb-2 flex flex-wrap gap-1">
        {AGENT_QUICK_ACTIONS.slice(0, 4).map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => sendMessage(action)}
            disabled={loading}
            className="text-[10px] border border-gray-200 bg-white px-2 py-1 rounded-full hover:border-pru-red disabled:opacity-40"
          >
            {action}
          </button>
        ))}
      </div>

      <div className="border-t bg-white p-3 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chat with copilot…"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary text-sm px-3 disabled:opacity-50">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
