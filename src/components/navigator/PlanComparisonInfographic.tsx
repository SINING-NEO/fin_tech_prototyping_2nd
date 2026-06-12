"use client";

import type { MatchedProduct } from "@/lib/navigator/types";

interface PlanComparisonInfographicProps {
  products: MatchedProduct[];
  compact?: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  Basic: "bg-gray-100 text-gray-700 border-gray-200",
  Standard: "bg-blue-50 text-blue-800 border-blue-200",
  Comprehensive: "bg-pru-red-light text-pru-red-dark border-red-200",
};

export function PlanComparisonInfographic({ products, compact = false }: PlanComparisonInfographicProps) {
  if (products.length === 0) {
    return (
      <p className="text-xs text-gray-500 italic">Plan comparison will appear after intake is processed.</p>
    );
  }

  const maxPremium = Math.max(...products.map((p) => p.premiumMax));

  return (
    <div className={`space-y-3 ${compact ? "text-xs" : "text-sm"}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">📊</span>
        <h4 className="font-semibold text-pru-gray-dark">Plan comparison at a glance</h4>
      </div>

      <div className="grid gap-3">
        {products.map((product, idx) => {
          const level = product.coverageLevel ?? (idx === 0 ? "Basic" : idx === 1 ? "Standard" : "Comprehensive");
          const premiumPct = Math.round((product.premiumMax / maxPremium) * 100);
          return (
            <div
              key={product.id}
              className="border border-pru-gray-border rounded-xl p-3 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-pru-gray-dark">{product.name}</p>
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border ${LEVEL_COLORS[level] ?? LEVEL_COLORS.Standard}`}>
                    {level} coverage
                  </span>
                </div>
                <p className="text-right font-semibold text-pru-red whitespace-nowrap">
                  ${product.premiumMin}–${product.premiumMax}
                  <span className="text-[10px] text-gray-500 font-normal">/mo</span>
                </p>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                  <span>Estimated premium</span>
                  <span>{premiumPct}% of highest</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pru-red rounded-full transition-all"
                    style={{ width: `${premiumPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                  <p className="font-medium text-green-800 mb-0.5">Covers</p>
                  <p className="text-green-700 leading-snug">{product.covers.slice(0, 2).join(" · ")}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                  <p className="font-medium text-amber-800 mb-0.5">Trade-off</p>
                  <p className="text-amber-700 leading-snug line-clamp-2">{product.limitations}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 italic">
        Illustrative comparison for consultation support — Financial Representative confirms suitability.
      </p>
    </div>
  );
}
