"use client";

import type { FrHandoffDocument } from "@/lib/navigator/types";
import { PlanComparisonInfographic } from "./PlanComparisonInfographic";
import { PruAssistChatSummaryPanel } from "./PruAssistChatSummaryPanel";
import type { MatchedProduct } from "@/lib/navigator/types";

interface RepBriefingPanelProps {
  handoff: FrHandoffDocument;
  products: MatchedProduct[];
  sessionId: string;
  /** When true, parent handles scrolling (e.g. agent sidebar Customer Dash). */
  embedded?: boolean;
}

export function RepBriefingPanel({ handoff, products, sessionId, embedded = false }: RepBriefingPanelProps) {
  const insight = handoff.customerInsight;
  const briefing = handoff.repBriefing;

  return (
    <div className={`space-y-4 text-sm min-w-0 ${embedded ? "pb-2" : "overflow-y-auto max-h-full"}`}>
      <div className="bg-pru-red text-white rounded-xl px-4 py-3">
        <p className="text-[10px] uppercase tracking-wide opacity-80">Step 2 · Pre-meeting briefing</p>
        <h3 className="font-bold text-base mt-0.5">Customer Brief Dashboard</h3>
        <p className="text-xs text-red-100 mt-1 font-mono">Session ID: {sessionId.slice(0, 8)}…</p>
      </div>

      {handoff.pruAssistChatSummary && (
        <PruAssistChatSummaryPanel summary={handoff.pruAssistChatSummary} role="agent" />
      )}

      {insight && (
        <section className="border border-pru-gray-border rounded-xl p-4 bg-white">
          <h4 className="font-semibold text-pru-gray-dark flex items-center gap-2">
            <span>🧠</span> AI Customer Insight Summary
          </h4>
          <p className="mt-2 text-xs bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-amber-900">
            {insight.riskProfileLabel}
          </p>
          <div className="mt-3 grid gap-2 text-xs">
            <div>
              <p className="font-medium text-gray-500">Priority mapping</p>
              <ul className="list-disc ml-4 mt-0.5 text-gray-700">
                {insight.priorityMapping.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-500">Likely objections</p>
              <ul className="list-disc ml-4 mt-0.5 text-gray-700">
                {insight.likelyObjections.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-500">Recommended direction</p>
              <p className="text-gray-700">{insight.recommendedDirection}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Explanation style</p>
              <p className="text-gray-700 capitalize">{insight.explanationStyle} — {insight.explanationStyleNote}</p>
            </div>
          </div>
        </section>
      )}

      <section className="border border-pru-gray-border rounded-xl p-4 bg-white">
        <h4 className="font-semibold text-pru-gray-dark">Customer profile</h4>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
          <p><span className="text-gray-500">Age:</span> {handoff.demographics.ageRange ?? "—"}</p>
          <p><span className="text-gray-500">Family:</span> {handoff.demographics.familySituation ?? "—"}</p>
          <p><span className="text-gray-500">Employment:</span> {handoff.demographics.employmentType ?? "—"}</p>
          <p><span className="text-gray-500">Budget:</span> {handoff.demographics.budgetPreference ?? "—"}</p>
          <p><span className="text-gray-500">Existing cover:</span> {handoff.demographics.existingCoverage ?? "—"}</p>
          <p><span className="text-gray-500">Familiarity:</span> {handoff.demographics.insuranceFamiliarity ?? "—"}</p>
        </div>
        {insight?.rankedConcerns.length ? (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500">Key concerns (ranked)</p>
            <ol className="list-decimal ml-4 text-xs text-gray-700 mt-0.5">
              {insight.rankedConcerns.map((c) => (
                <li key={c.concern}>{c.concern}</li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      <section className="border border-pru-gray-border rounded-xl p-4 bg-white">
        <PlanComparisonInfographic products={products} compact />
      </section>

      {briefing && (
        <>
          <section className="border border-pru-gray-border rounded-xl p-4 bg-white">
            <h4 className="font-semibold text-pru-gray-dark">💬 Suggested talking points</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-gray-700">
              {briefing.talkingPoints.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-pru-red">•</span>{t}
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-pru-gray-border rounded-xl p-4 bg-blue-50">
            <h4 className="font-semibold text-blue-900">📝 &quot;Explain like this&quot; script</h4>
            <ul className="mt-2 space-y-2 text-xs text-blue-800 italic">
              {briefing.explainLikeThis.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <section className="border border-amber-200 rounded-xl p-4 bg-amber-50">
            <h4 className="font-semibold text-amber-900">⚠️ Misconception warnings</h4>
            <ul className="mt-2 space-y-1 text-xs text-amber-800">
              {briefing.misconceptionWarnings.map((w) => (
                <li key={w}>• {w}</li>
              ))}
            </ul>
          </section>

          <section className="border border-pru-gray-border rounded-xl p-4 bg-white">
            <h4 className="font-semibold text-pru-gray-dark">🧭 Explanation priority</h4>
            <ol className="mt-2 space-y-1 text-xs text-gray-700">
              {briefing.explanationPriority.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="border border-pru-gray-border rounded-xl p-4 bg-gray-50">
            <h4 className="font-semibold text-pru-gray-dark">Simple analogies</h4>
            <dl className="mt-2 space-y-2 text-xs">
              {briefing.analogies.map((a) => (
                <div key={a.term}>
                  <dt className="font-medium text-pru-red">{a.term}</dt>
                  <dd className="text-gray-600 ml-2">{a.analogy}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}
    </div>
  );
}
