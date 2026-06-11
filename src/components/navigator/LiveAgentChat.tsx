"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { MessageBubble } from "@/components/MessageBubble";
import type { ChatMessage } from "@/lib/types";
import type { CustomerLiveSession } from "@/lib/session-store";

interface LiveAgentChatProps {
  sessionId: string;
  compact?: boolean;
}

export function LiveAgentChat({ sessionId, compact = false }: LiveAgentChatProps) {
  const [liveSession, setLiveSession] = useState<CustomerLiveSession | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setLiveSession(data.session);
        }
      } catch {
        /* ignore */
      }
    }
    poll();
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveSession?.liveMessages]);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");

    const optimistic: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setLiveSession((prev) =>
      prev ? { ...prev, liveMessages: [...prev.liveMessages, optimistic] } : prev
    );

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, role: "customer" }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiveSession(data.session);
      }
    } finally {
      setSending(false);
    }
  }

  const waiting = liveSession?.status === "waiting_for_agent";
  const live = liveSession?.status === "live_with_agent";
  const messages = liveSession?.liveMessages ?? [];

  return (
    <div className={`flex flex-col ${compact ? "h-64" : "h-80"} border-t border-pru-gray-border`}>
      <div className={`${compact ? "px-3 py-2" : "px-4 py-3"} bg-pru-gray-dark text-white flex-shrink-0`}>
        <p className="font-medium text-sm">Financial Representative</p>
        <p className="text-xs text-gray-300 mt-0.5">
          {waiting && "⏳ Waiting for an available representative…"}
          {live && "🟢 Connected — live chat"}
          {!waiting && !live && "Connecting…"}
        </p>
      </div>

      <div className={`flex-1 overflow-y-auto ${compact ? "px-3 py-3" : "px-4 py-4"}`}>
        {waiting && messages.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-6">
            Your summary has been sent to the queue. A representative will join shortly.
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} compact={compact} />
        ))}
        <div ref={bottomRef} />
      </div>

      {live && (
        <div className={`border-t border-pru-gray-border p-3 flex gap-2 flex-shrink-0`}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message your representative…"
            className="flex-1 border border-pru-gray-border rounded-full px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
