import { PRODUCTS } from "./products";
import type {
  CustomerProfile,
  InsuranceType,
  MatchedProduct,
  NavigatorSession,
  FrHandoffDocument,
  ConfidenceLevel,
} from "./types";

function budgetMultiplier(budget?: CustomerProfile["budgetPreference"]): number {
  if (budget === "Budget-conscious") return 0.85;
  if (budget === "Premium coverage") return 1.35;
  return 1;
}

function ageMultiplier(age?: CustomerProfile["ageRange"]): number {
  const map: Record<string, number> = {
    "18-25": 0.75,
    "26-35": 0.9,
    "36-45": 1,
    "46-55": 1.25,
    "56+": 1.5,
  };
  return age ? (map[age] ?? 1) : 1;
}

export function calculatePremiumRange(
  product: (typeof PRODUCTS)[0],
  profile: CustomerProfile
): { min: number; max: number } {
  const base = product.premiumBase * ageMultiplier(profile.ageRange) * budgetMultiplier(profile.budgetPreference);
  const min = Math.round(base * 0.9);
  const max = Math.round(base * 1.2);
  return { min, max };
}

export function interpretConcern(concern: string): InsuranceType | null {
  const lower = concern.toLowerCase();
  if (/hospital|medical|health|bill|surgery|doctor/.test(lower)) return "Health";
  if (/accident|injury|disability|sports/.test(lower)) return "Accident";
  if (/critical|cancer|stroke|illness|heart/.test(lower)) return "Critical illness";
  if (/family|death|income|dependents|life|protect/.test(lower)) return "Life";
  return null;
}

export function matchProducts(
  concern: string,
  insuranceType: InsuranceType | undefined,
  profile: CustomerProfile
): MatchedProduct[] {
  const inferred = interpretConcern(concern);
  const targetType = insuranceType ?? inferred;

  let candidates = PRODUCTS;
  if (targetType) {
    candidates = PRODUCTS.filter((p) => p.type === targetType);
  }

  const lower = concern.toLowerCase();
  const scored = candidates.map((product) => {
    let score = 0;
    for (const kw of product.keywords) {
      if (lower.includes(kw)) score += 3;
    }
    if (profile.familySituation?.includes("children") && product.type === "Life") score += 2;
    if (profile.budgetPreference === "Budget-conscious" && product.premiumBase < 100) score += 2;
    if (profile.budgetPreference === "Premium coverage" && product.premiumBase >= 150) score += 2;
    return { product, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ product, score }) => {
      const { min, max } = calculatePremiumRange(product, profile);
      const matchReason =
        score > 0
          ? `Matches your concern about "${concern.slice(0, 40)}${concern.length > 40 ? "..." : ""}" and your profile.`
          : `Relevant ${product.type} option based on your stated needs.`;
      return {
        ...product,
        premiumMin: min,
        premiumMax: max,
        matchReason,
      };
    });
}

export function getAdaptiveQuestion(profile: CustomerProfile, concern?: string): string | null {
  if (!profile.budgetPreference)
    return "Are you more budget-conscious, or looking for comprehensive coverage?";
  if (!profile.familySituation && concern?.toLowerCase().includes("family"))
    return "Tell me about your family — who depends on your income?";
  if (profile.insuranceFamiliarity === "New to insurance")
    return "Would you like me to explain any insurance terms in simpler language?";
  if (profile.insuranceFamiliarity === "Very familiar")
    return "Would you like a quick comparison of key trade-offs between these plans?";
  return null;
}

export function buildDecisionRationale(session: NavigatorSession): string {
  const { profile, concern, matchedProducts } = session;
  const parts: string[] = [];

  if (concern) parts.push(`You mentioned: "${concern}".`);
  if (profile.familySituation) parts.push(`Your family situation (${profile.familySituation}) was considered.`);
  if (profile.budgetPreference) parts.push(`Your budget preference (${profile.budgetPreference}) shaped the premium estimates.`);

  if (matchedProducts.length > 0) {
    parts.push(
      `These plans may align with your needs: ${matchedProducts.map((p) => p.name).join(", ")}.`
    );
  }

  parts.push(
    "Final suitability should be confirmed with your Financial Representative — they will assess your full situation."
  );

  return parts.join(" ");
}

export function buildHandoffDocument(session: NavigatorSession): FrHandoffDocument {
  const budgetRanges = session.matchedProducts.map(
    (p) => `${p.name}: $${p.premiumMin}–$${p.premiumMax}/mo`
  );

  return {
    sessionId: session.id,
    generatedAt: new Date().toISOString(),
    customerSummary: {
      needsIdentified: [
        session.topIntent ?? "Insurance",
        session.insuranceType ?? interpretConcern(session.concern ?? "") ?? "General",
        session.concern ?? "Not specified",
      ].filter(Boolean) as string[],
      productsExplored: session.matchedProducts.map((p) => p.name),
      questionsAsked: session.questionsAsked,
      estimatedBudgetRange: budgetRanges.join("; ") || "Not calculated",
      remainingConcerns: session.remainingConcerns,
      confidenceLevel: session.confidenceLevel ?? "not recorded",
    },
    demographics: session.profile,
    protectionPriorities: [
      session.concern ?? "Protection needs to be confirmed",
      session.insuranceType ? `${session.insuranceType} coverage` : "Type TBD",
    ],
    plansConsidered: session.matchedProducts.map((p) => ({
      name: p.name,
      premiumRange: `$${p.premiumMin}–$${p.premiumMax}/month`,
      matchReason: p.matchReason,
    })),
    outstandingQuestions:
      session.confidenceLevel === "confused"
        ? ["Customer requested clearer explanations", ...session.remainingConcerns]
        : session.remainingConcerns,
    retentionNote: session.wantsFrHelp
      ? "Customer requested Financial Representative follow-up — send handoff immediately."
      : "Customer self-served. Save summary in financial system for ~6 months for future FR outreach.",
  };
}

export function saveHandoffToStorage(doc: FrHandoffDocument): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("pru_fr_handoff", JSON.stringify(doc));
  sessionStorage.setItem("pru_fr_handoff_saved_at", doc.generatedAt);
}

export function loadHandoffFromStorage(): FrHandoffDocument | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("pru_fr_handoff");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FrHandoffDocument;
  } catch {
    return null;
  }
}

export function generateSummaryHtml(doc: FrHandoffDocument): string {
  const d = doc.demographics;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>PruAssist Summary</title>
<style>
  body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;padding:20px;color:#333}
  h1{color:#ED1B2E;font-size:22px} h2{font-size:16px;margin-top:24px;border-bottom:2px solid #ED1B2E;padding-bottom:4px}
  ul{line-height:1.7} .footer{margin-top:32px;font-size:12px;color:#666}
</style></head><body>
<h1>PruAssist — Insurance Navigator Summary</h1>
<p>Generated: ${new Date(doc.generatedAt).toLocaleString()}</p>
<h2>Needs Identified</h2><ul>${doc.customerSummary.needsIdentified.map((n) => `<li>${n}</li>`).join("")}</ul>
<h2>Products Explored</h2><ul>${doc.customerSummary.productsExplored.map((p) => `<li>${p}</li>`).join("") || "<li>None</li>"}</ul>
<h2>Estimated Budget Range</h2><p>${doc.customerSummary.estimatedBudgetRange}</p>
<h2>Confidence Level</h2><p>${doc.customerSummary.confidenceLevel}</p>
<h2>Demographics</h2><ul>
<li>Age: ${d.ageRange ?? "—"}</li><li>Family: ${d.familySituation ?? "—"}</li>
<li>Budget: ${d.budgetPreference ?? "—"}</li><li>English: ${d.englishProficiency ?? "—"}</li>
<li>Familiarity: ${d.insuranceFamiliarity ?? "—"}</li></ul>
<h2>Plans Considered</h2><ul>${doc.plansConsidered.map((p) => `<li><strong>${p.name}</strong> (${p.premiumRange}) — ${p.matchReason}</li>`).join("") || "<li>None</li>"}</ul>
<h2>Outstanding Questions</h2><ul>${doc.outstandingQuestions.map((q) => `<li>${q}</li>`).join("") || "<li>None</li>"}</ul>
<p class="footer">Prototype document — Financial Representative to confirm suitability. Not a binding recommendation.</p>
</body></html>`;
}

export function downloadSummaryPdf(doc: FrHandoffDocument): void {
  const html = generateSummaryHtml(doc);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PruAssist-Summary-${doc.sessionId.slice(0, 8)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export const CONFIDENCE_OPTIONS: { level: ConfidenceLevel; label: string; emoji: string }[] = [
  { level: "confused", label: "Still confused", emoji: "😟" },
  { level: "somewhat", label: "Somewhat understand", emoji: "😐" },
  { level: "confident", label: "I understand well", emoji: "😊" },
];
