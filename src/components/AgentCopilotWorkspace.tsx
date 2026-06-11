"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { AGENT_QUICK_ACTIONS } from "@/lib/prompts";
import { CATEGORY_LABELS } from "@/lib/knowledge";
import { loadHandoffFromStorage } from "@/lib/navigator/engine";
import type { FrHandoffDocument } from "@/lib/navigator/types";
import type { ChatMessage, CopilotResponse, CopilotSuggestion } from "@/lib/types";

const SAMPLE_CONVERSATION: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi! I'm PruAssist. How can I help you today?",
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "2",
    role: "user",
    content:
      "My father passed away last week and I think he had a Prudential life insurance policy. I don't know the policy number.",
    timestamp: new Date(Date.now() - 90000).toISOString(),
  },
  {
    id: "3",
    role: "assistant",
    content:
      "I'm so sorry for your loss. I understand this is a difficult time. We can help you start the process even without the policy number. Do you know approximately when the policy was purchased, or do you have any documents that might reference Prudential?",
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "4",
    role: "user",
    content:
      "I found an old statement from 2019. It says term life but the policy number is faded. I can barely make out it starts with an M.",
    timestamp: new Date(Date.now() - 30000).toISOString(),
  },
];

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
        <span className="text-xs text-gray-400 uppercase">{suggestion.type.replace("_", " ")}</span>
      </div>
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{suggestion.content}</p>
      {suggestion.type === "response_draft" && onUse && (
        <button
          type="button"
          onClick={() => onUse(suggestion.content)}
          className="mt-3 text-xs text-pru-red font-medium hover:underline"
        >
          Copy to reply →
        </button>
      )}
    </div>
  );
}

export function AgentCopilotWorkspace() {
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_CONVERSATION);
  const [copilot, setCopilot] = useState<CopilotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentInput, setAgentInput] = useState("");
  const [draftReply, setDraftReply] = useState("");
  const [handoff, setHandoff] = useState<FrHandoffDocument | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    setHandoff(loadHandoffFromStorage());
  }, []);

  const fetchCopilot = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, agentQuery: query }),
      });
      const data: CopilotResponse = await res.json();
      setCopilot(data);
    } catch {
      setCopilot(null);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchCopilot();
    }
  }, [fetchCopilot]);

  function addAgentReply() {
    if (!draftReply.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        role: "assistant",
        content: draftReply.trim(),
        timestamp: new Date().toISOString(),
      },
    ]);
    setDraftReply("");
    setTimeout(() => fetchCopilot("Refresh suggestions after agent reply"), 500);
  }

  function addSimulatedCustomerMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      },
    ]);
    setTimeout(() => fetchCopilot(), 500);
  }

  const sentimentColor = {
    positive: "bg-green-100 text-green-800",
    neutral: "bg-gray-100 text-gray-700",
    concerned: "bg-amber-100 text-amber-800",
    distressed: "bg-red-100 text-red-800",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 h-[calc(100vh-7rem)]">
      {/* Live conversation panel */}
      <div className="lg:col-span-2 border-r border-gray-200 flex flex-col bg-white">
        <div className="px-4 py-3 border-b border-gray-200 bg-pru-red-light">
          <h2 className="font-semibold text-pru-red-dark">Live Customer Chat</h2>
          <p className="text-xs text-gray-500 mt-0.5">Simulated session — agent view</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        <div className="border-t border-gray-200 p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Agent reply draft
            </label>
            <textarea
              value={draftReply}
              onChange={(e) => setDraftReply(e.target.value)}
              rows={3}
              placeholder="Type or paste from copilot suggestion..."
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pru-red"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addAgentReply} className="btn-primary text-sm flex-1">
              Send as Agent
            </button>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500 hover:text-pru-red">
              Simulate customer message
            </summary>
            <div className="mt-2 space-y-1">
              {[
                "Yes, I have his social security number if that helps",
                "How long does the claim process usually take?",
                "Can I speak to someone about this in person?",
              ].map((sim) => (
                <button
                  key={sim}
                  type="button"
                  onClick={() => addSimulatedCustomerMessage(sim)}
                  className="block w-full text-left text-xs text-gray-600 hover:text-pru-red py-1"
                >
                  + {sim}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Copilot panel */}
      <div className="lg:col-span-3 flex flex-col bg-gray-50">
        <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-pru-red-dark">Agent Copilot</h2>
            <p className="text-xs text-gray-500">Real-time guidance powered by RAG + LLM</p>
          </div>
          <div className="flex items-center gap-2">
            {copilot?.customerSentiment && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${sentimentColor[copilot.customerSentiment]}`}
              >
                {copilot.customerSentiment}
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchCopilot()}
              disabled={loading}
              className="btn-secondary text-sm py-1.5 px-3"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-gray-200 bg-white flex flex-wrap gap-2">
          {AGENT_QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => fetchCopilot(action)}
              className="text-xs border border-gray-200 bg-gray-50 hover:bg-pru-red-light hover:border-pru-red text-gray-600 px-3 py-1.5 rounded-full transition-colors"
            >
              {action}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {handoff && (
            <div className="copilot-card border-l-4 border-l-pru-red bg-red-50">
              <h3 className="font-semibold text-sm text-pru-red-dark">Customer Handoff Summary</h3>
              <p className="text-xs text-gray-500 mt-1">
                From Insurance Navigator · {new Date(handoff.generatedAt).toLocaleString()}
              </p>
              <div className="mt-3 text-xs text-gray-700 space-y-2">
                <p><strong>Needs:</strong> {handoff.customerSummary.needsIdentified.join(" · ")}</p>
                <p><strong>Plans considered:</strong> {handoff.plansConsidered.map((p) => p.name).join(", ") || "—"}</p>
                <p><strong>Budget:</strong> {handoff.customerSummary.estimatedBudgetRange}</p>
                <p><strong>Confidence:</strong> {handoff.customerSummary.confidenceLevel}</p>
                <p><strong>Demographics:</strong> {handoff.demographics.ageRange}, {handoff.demographics.familySituation}, {handoff.demographics.budgetPreference}</p>
                {handoff.outstandingQuestions.length > 0 && (
                  <p><strong>Outstanding:</strong> {handoff.outstandingQuestions.join("; ")}</p>
                )}
                <p className="italic text-gray-500">{handoff.retentionNote}</p>
              </div>
              <button
                type="button"
                onClick={() => setHandoff(loadHandoffFromStorage())}
                className="mt-2 text-xs text-pru-red hover:underline"
              >
                Refresh handoff
              </button>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-pru-red border-t-transparent rounded-full animate-spin" />
              Analyzing conversation...
            </div>
          )}

          {copilot?.suggestions?.map((s, i) => (
            <SuggestionCard
              key={`${s.type}-${i}`}
              suggestion={s}
              onUse={(content) => setDraftReply(content)}
            />
          ))}

          {copilot?.recommendedDisposition && (
            <div className="copilot-card bg-pru-red-light border-pru-red">
              <h4 className="font-medium text-sm text-pru-red-dark">Suggested Disposition</h4>
              <p className="text-sm text-pru-red mt-1">{copilot.recommendedDisposition}</p>
            </div>
          )}

          {copilot?.retrievedArticles && copilot.retrievedArticles.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Knowledge Sources
              </h3>
              <div className="space-y-2">
                {copilot.retrievedArticles.map((ctx) => (
                  <div
                    key={ctx.article.id}
                    className="text-xs bg-white border border-gray-200 rounded p-3"
                  >
                    <span className="font-medium text-pru-red">{ctx.article.title}</span>
                    <span className="text-gray-400 ml-2">
                      {CATEGORY_LABELS[ctx.article.category] ?? ctx.article.category}
                    </span>
                    <p className="text-gray-600 mt-1 line-clamp-2">{ctx.article.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchCopilot(agentInput);
              setAgentInput("");
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              placeholder="Ask copilot: e.g. 'What docs needed for M-prefix policy claim?'"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pru-red"
            />
            <button type="submit" className="btn-primary text-sm">
              Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
