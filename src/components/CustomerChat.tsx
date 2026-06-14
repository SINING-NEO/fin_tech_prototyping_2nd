"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { SUGGESTED_STARTERS } from "@/lib/prompts";
import type { ChatMessage, ChatResponse } from "@/lib/types";
import type { FrHandoffDocument, PruAssistChatSummary } from "@/lib/navigator/types";
import { syncAiChatMessages } from "@/lib/navigator/session-api";
import { buildPruAssistChatSummary } from "@/lib/navigator/engine";
import { PruAssistChatSummaryPanel } from "./navigator/PruAssistChatSummaryPanel";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm PruAssist, your Insurance Navigator. I help explain policy topics in plain language and prepare you for conversations with your Financial Representative.\n\nI can clarify terms, guide self-service steps, and help you feel confident — but I won't replace your advisor for suitability or product decisions.\n\nWhat would you like to understand today?",
  timestamp: new Date().toISOString(),
};

const POST_NAVIGATOR_WELCOME: ChatMessage = {
  id: "post-nav-welcome",
  role: "assistant",
  content:
    "Your summary is ready! I'm still here if you have more questions.\n\nAsk me to explain any plan in simpler terms, compare options, or help you prepare for a conversation with your Financial Representative.",
  timestamp: new Date().toISOString(),
};

interface CustomerChatProps {
  compact?: boolean;
  postNavigator?: boolean;
  productLine?: string;
  handoffContext?: FrHandoffDocument;
  sessionId?: string;
  navigatorSession?: import("@/lib/navigator/types").NavigatorSession;
}

export function CustomerChat({
  compact = false,
  postNavigator = false,
  productLine,
  handoffContext,
  sessionId,
  navigatorSession,
}: CustomerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    postNavigator ? [POST_NAVIGATOR_WELCOME] : [WELCOME_MESSAGE]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [escalation, setEscalation] = useState<{ show: boolean; reason?: string }>({
    show: false,
  });
  const [chatSummary, setChatSummary] = useState<PruAssistChatSummary | null>(
    handoffContext?.pruAssistChatSummary ?? null
  );
  const [summarySynced, setSummarySynced] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function persistChatSummary(updatedMessages: ChatMessage[]) {
    if (!sessionId || !navigatorSession) return;
    const summary = buildPruAssistChatSummary(navigatorSession, updatedMessages);
    setChatSummary(summary);
    const ok = await syncAiChatMessages(sessionId, updatedMessages);
    setSummarySynced(ok);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setFollowUps([]);
    setEscalation({ show: false });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          mode: "customer",
          sessionContext: {
            productLine: productLine ?? handoffContext?.customerSummary.needsIdentified[1],
            summarySnippet: handoffContext
              ? `Plans explored: ${handoffContext.customerSummary.productsExplored.join(", ")}. Budget: ${handoffContext.customerSummary.estimatedBudgetRange}. Confidence: ${handoffContext.customerSummary.confidenceLevel}.`
              : undefined,
          },
        }),
      });

      const data: ChatResponse = await res.json();

      const assistantMsg: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setFollowUps(data.suggestedFollowUps ?? []);

      const fullMessages = [...updatedMessages, assistantMsg];
      void persistChatSummary(fullMessages);

      if (data.escalateToHuman) {
        setEscalation({ show: true, reason: data.escalationReason });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content:
            "I'm having a little trouble right now. You can reach our team at 1-800-778-2255, Mon-Fri 8 AM-8 PM ET, and they'll be happy to help.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {chatSummary && chatSummary.messageCount > 1 && (
        <div className={`flex-shrink-0 ${compact ? "px-3 pt-3" : "px-4 pt-4"}`}>
          <PruAssistChatSummaryPanel summary={chatSummary} compact={compact} role="customer" />
          {summarySynced && (
            <p className="text-[10px] text-green-700 mt-1 text-center">
              Summary shared with your Financial Representative
            </p>
          )}
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${compact ? "px-3 py-4" : "px-4 py-6"}`}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} compact={compact} />
        ))}
        {loading && <TypingIndicator compact={compact} />}
        <div ref={bottomRef} />
      </div>

      {escalation.show && (
        <div className="mx-3 sm:mx-4 mb-2 p-3 bg-pru-red-light border border-red-200 rounded-lg text-sm">
          <p className="font-medium text-pru-red-dark">Connect with a specialist</p>
          <p className="text-gray-700 mt-1 text-xs">
            {escalation.reason ?? "This may be best handled by a human representative."}
          </p>
          <button
            type="button"
            className="mt-2 text-pru-red font-medium text-xs hover:underline"
            onClick={() =>
              sendMessage("I'd like to speak with a representative please")
            }
          >
            Request live agent →
          </button>
        </div>
      )}

      {followUps.length > 0 && !loading && (
        <div className="px-3 sm:px-4 pb-2 flex flex-wrap gap-1.5">
          {followUps.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => sendMessage(f)}
              className="text-xs bg-pru-red-light text-pru-red px-2.5 py-1 rounded-full hover:bg-red-100 transition-colors"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {messages.length <= 1 && (
        <div className="px-3 sm:px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTED_STARTERS.slice(0, compact ? 3 : 4).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => sendMessage(s)}
              className="text-xs border border-pru-gray-border bg-white text-gray-600 px-2.5 py-1 rounded-full hover:border-pru-red hover:text-pru-red transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-pru-gray-border bg-white p-3 sm:p-4 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-pru-gray-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pru-red focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
        {!compact && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Prototype only — not connected to real Prudential systems
          </p>
        )}
      </div>
    </div>
  );
}
