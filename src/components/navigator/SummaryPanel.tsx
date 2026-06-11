"use client";

import type { FrHandoffDocument } from "@/lib/navigator/types";
import { downloadSummaryPdf } from "@/lib/navigator/engine";

interface SummaryPanelProps {
  handoff: FrHandoffDocument;
  compact?: boolean;
  defaultOpen?: boolean;
}

export function SummaryPanel({ handoff, compact = false, defaultOpen = false }: SummaryPanelProps) {
  return (
    <details
      className={`border border-pru-gray-border rounded-lg bg-pru-gray-light ${compact ? "text-xs" : "text-sm"}`}
      open={defaultOpen}
    >
      <summary className="cursor-pointer px-3 py-2 font-medium text-pru-gray-dark hover:text-pru-red">
        📋 View my session summary
      </summary>
      <div className="px-3 pb-3 space-y-2 text-gray-700 border-t border-pru-gray-border pt-2">
        <p><strong>Needs:</strong> {handoff.customerSummary.needsIdentified.join(" · ")}</p>
        <p><strong>Plans explored:</strong> {handoff.customerSummary.productsExplored.join(", ") || "—"}</p>
        <p><strong>Budget:</strong> {handoff.customerSummary.estimatedBudgetRange}</p>
        <p><strong>Confidence:</strong> {handoff.customerSummary.confidenceLevel}</p>
        {handoff.plansConsidered.length > 0 && (
          <ul className="list-disc ml-4 space-y-0.5">
            {handoff.plansConsidered.map((p) => (
              <li key={p.name}>{p.name} ({p.premiumRange})</li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => downloadSummaryPdf(handoff)}
          className="text-pru-red hover:underline text-xs mt-1"
        >
          Download full summary
        </button>
      </div>
    </details>
  );
}
