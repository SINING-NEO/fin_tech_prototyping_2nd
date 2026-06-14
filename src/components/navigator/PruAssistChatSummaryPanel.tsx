"use client";

import type { PruAssistChatSummary } from "@/lib/navigator/types";

interface PruAssistChatSummaryPanelProps {
  summary: PruAssistChatSummary;
  compact?: boolean;
  role?: "customer" | "agent";
}

export function PruAssistChatSummaryPanel({
  summary,
  compact = false,
  role = "agent",
}: PruAssistChatSummaryPanelProps) {
  const hasChat = summary.messageCount > 1;

  return (
    <section
      className={`border rounded-xl ${
        role === "customer"
          ? "border-green-200 bg-green-50"
          : "border-indigo-200 bg-indigo-50"
      } ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4
            className={`font-semibold ${
              role === "customer" ? "text-green-900" : "text-indigo-900"
            }`}
          >
            {role === "customer" ? "Your PruAssist summary" : "PruAssist chat brief"}
          </h4>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {hasChat
              ? role === "customer"
                ? "Saved for your Financial Representative before the live session"
                : `${summary.messageCount} messages · generated ${new Date(summary.generatedAt).toLocaleTimeString()}`
              : "No PruAssist conversation yet"}
          </p>
        </div>
        {hasChat && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 flex-shrink-0">
            For rep
          </span>
        )}
      </div>

      {hasChat && (
        <div className={`mt-3 space-y-3 text-xs ${role === "customer" ? "text-green-900" : "text-indigo-900"}`}>
          {summary.topicsDiscussed.length > 0 && (
            <div>
              <p className="font-medium opacity-70">Topics discussed</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {summary.topicsDiscussed.map((t) => (
                  <li key={t} className="px-2 py-0.5 rounded-full bg-white/70 border border-current/10">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {role === "agent" && summary.repTalkingPoints.length > 0 && (
            <div>
              <p className="font-medium opacity-70">Rep talking points</p>
              <ul className="mt-1 space-y-1">
                {summary.repTalkingPoints.map((p) => (
                  <li key={p} className="flex gap-1.5">
                    <span>→</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.customerQuestions.length > 0 &&
            summary.customerQuestions[0] !== "No explicit questions recorded" && (
              <div>
                <p className="font-medium opacity-70">Customer questions</p>
                <ul className="mt-1 list-disc ml-4 space-y-0.5">
                  {summary.customerQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

          {summary.remainingQuestions.length > 0 && role === "agent" && (
            <div>
              <p className="font-medium opacity-70">Still to clarify live</p>
              <ul className="mt-1 list-disc ml-4 space-y-0.5">
                {summary.remainingQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
