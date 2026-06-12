"use client";

import type { PostMeetingSummary } from "@/lib/navigator/types";

interface PostMeetingSummaryPanelProps {
  summary: PostMeetingSummary;
  sessionId: string;
  role: "customer" | "agent";
}

export function PostMeetingSummaryPanel({ summary, sessionId, role }: PostMeetingSummaryPanelProps) {
  return (
    <div className="space-y-4 text-sm">
      <div className="bg-pru-gray-dark text-white rounded-xl px-4 py-3">
        <p className="text-[10px] uppercase tracking-wide opacity-80">Step 4 · Post-meeting summary</p>
        <h3 className="font-bold text-base mt-0.5">
          {role === "customer" ? "Your consultation summary" : "Consultation wrap-up"}
        </h3>
        <p className="text-xs text-gray-300 mt-1">
          Generated {new Date(summary.generatedAt).toLocaleString()} · Session {sessionId.slice(0, 8)}
        </p>
      </div>

      <section className="border border-pru-gray-border rounded-xl p-4 bg-white">
        <h4 className="font-semibold text-pru-gray-dark">Discussion summary</h4>
        <p className="mt-2 text-xs text-gray-700 leading-relaxed">{summary.discussionSummary}</p>
      </section>

      <div className="grid sm:grid-cols-2 gap-3">
        <section className="border border-green-200 rounded-xl p-3 bg-green-50">
          <h4 className="font-semibold text-green-900 text-xs">Priorities confirmed</h4>
          <ul className="mt-1.5 list-disc ml-4 text-xs text-green-800">
            {summary.prioritiesConfirmed.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
        <section className="border border-blue-200 rounded-xl p-3 bg-blue-50">
          <h4 className="font-semibold text-blue-900 text-xs">Plans discussed</h4>
          <ul className="mt-1.5 list-disc ml-4 text-xs text-blue-800">
            {summary.plansDiscussed.length
              ? summary.plansDiscussed.map((p) => <li key={p}>{p}</li>)
              : <li>None recorded</li>}
          </ul>
        </section>
      </div>

      <section className="border border-amber-200 rounded-xl p-4 bg-amber-50">
        <h4 className="font-semibold text-amber-900">Remaining doubts</h4>
        <ul className="mt-2 list-disc ml-4 text-xs text-amber-800">
          {summary.remainingDoubts.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <section className="border border-pru-gray-border rounded-xl p-4 bg-white">
        <h4 className="font-semibold text-pru-gray-dark">Recommended follow-up</h4>
        <p className="mt-1 text-xs text-gray-700">{summary.recommendedFollowUp}</p>
        <div className="mt-3 p-3 bg-pru-red-light rounded-lg border border-red-100">
          <p className="text-xs font-medium text-pru-red-dark">Next best step</p>
          <p className="text-sm text-pru-red mt-0.5">{summary.nextBestStep}</p>
        </div>
      </section>

      <p className="text-[10px] text-gray-400 italic text-center">
        AI-generated summary to reduce admin — Financial Representative confirms accuracy before client follow-up.
      </p>
    </div>
  );
}
