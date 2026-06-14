import { PRODUCTS } from "./products";
import type {
  CustomerProfile,
  InsuranceType,
  MatchedProduct,
  NavigatorSession,
  FrHandoffDocument,
  ConfidenceLevel,
  CustomerInsightSummary,
  RepBriefing,
  ConsultationIntent,
  KeyConcern,
  RiskProfile,
  PostMeetingSummary,
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

export function intentToInsuranceType(intent?: ConsultationIntent): InsuranceType | undefined {
  if (intent === "Hospitalisation coverage") return "Health";
  if (intent === "Critical illness") return "Critical illness";
  if (intent === "Investment-linked") return "Life";
  return undefined;
}

export function concernsToText(concerns?: KeyConcern[]): string {
  return concerns?.join(". ") ?? "";
}

export function buildCustomerInsightSummary(session: NavigatorSession): CustomerInsightSummary {
  const { profile, keyConcerns, consultationIntent } = session;
  const familiarity = profile.insuranceFamiliarity;
  const english = profile.englishProficiency;
  const budget = profile.budgetPreference;

  let riskProfile: RiskProfile = "informed_explorer";
  let riskProfileLabel = "Informed explorer — ready for structured comparison";

  if (familiarity === "New to insurance" && (keyConcerns?.includes("High hospital bills") || keyConcerns?.includes("Affordability"))) {
    riskProfile = "high_concern_low_understanding";
    riskProfileLabel = "High concern, lower familiarity — prioritise reassurance and simple examples";
  } else if (budget === "Budget-conscious" || keyConcerns?.includes("Affordability")) {
    riskProfile = "cost_sensitive";
    riskProfileLabel = "Cost-sensitive — lead with value scenarios and premium tiers";
  } else if (keyConcerns?.includes("Long-term protection") || keyConcerns?.includes("Family protection")) {
    riskProfile = "coverage_focused";
    riskProfileLabel = "Coverage-focused — emphasise protection scope and family scenarios";
  }

  const priorityMapping: string[] = [];
  if (keyConcerns?.includes("Affordability") || budget === "Budget-conscious") priorityMapping.push("Cost vs coverage balance");
  if (keyConcerns?.includes("High hospital bills") || consultationIntent === "Hospitalisation coverage") priorityMapping.push("Hospitalisation protection depth");
  if (keyConcerns?.includes("Family protection")) priorityMapping.push("Dependents and income replacement");
  if (priorityMapping.length === 0) priorityMapping.push("Clarify primary need before deep plan comparison");

  const likelyObjections: string[] = [];
  if (budget === "Budget-conscious") likelyObjections.push("This sounds expensive for what I get");
  if (familiarity === "New to insurance") likelyObjections.push("I'm not sure I understand the difference between plans");
  if (profile.existingCoverage && profile.existingCoverage !== "None") likelyObjections.push("I already have some coverage — do I need more?");
  if (likelyObjections.length === 0) likelyObjections.push("I need time to think about it");

  let recommendedDirection = "PRUShield / health protection focus";
  if (consultationIntent === "Critical illness") recommendedDirection = "PRUCritical Cover / multi-crisis protection focus";
  else if (consultationIntent === "Investment-linked") recommendedDirection = "Investment-linked life plans — suitability-led discussion";
  else if (consultationIntent === "Not sure yet") recommendedDirection = "Needs discovery first — hospitalisation vs protection vs savings";

  let explanationStyle: CustomerInsightSummary["explanationStyle"] = "balanced";
  let explanationStyleNote = "Use clear structure with occasional detail";
  if (familiarity === "New to insurance" || english === "Basic") {
    explanationStyle = "simple";
    explanationStyleNote = "Short sentences, everyday analogies, avoid jargon";
  } else if (familiarity === "Very familiar" && english === "Fluent") {
    explanationStyle = "detailed";
    explanationStyleNote = "Can discuss trade-offs, riders, and policy mechanics directly";
  }

  const rankedConcerns: { concern: string; rank: number }[] = (keyConcerns ?? []).map((c, i) => ({ concern: c, rank: i + 1 }));
  if (session.concern) rankedConcerns.push({ concern: session.concern, rank: rankedConcerns.length + 1 });

  return {
    riskProfile,
    riskProfileLabel,
    priorityMapping,
    likelyObjections,
    recommendedDirection,
    explanationStyle,
    explanationStyleNote,
    rankedConcerns,
  };
}

export function buildRepBriefing(session: NavigatorSession, insight: CustomerInsightSummary): RepBriefing {
  const products = session.matchedProducts;
  const primary = products[0]?.name ?? "PRUShield Health";

  const talkingPoints = [
    `Open with their top concern: ${insight.rankedConcerns[0]?.concern ?? "protection needs"}`,
    `Recommended direction: ${insight.recommendedDirection}`,
    `Budget signal: ${session.profile.budgetPreference ?? "not stated"} — frame premiums accordingly`,
    session.profile.existingCoverage
      ? `Existing coverage: ${session.profile.existingCoverage} — clarify gaps before upselling`
      : "No existing coverage noted — explain baseline protection first",
  ];

  const explainLikeThis =
    insight.explanationStyle === "simple"
      ? [
          `"Think of the base plan as your safety net for big hospital bills."`,
          `"A rider is like an add-on layer — extra protection for specific situations."`,
          `"Premium is what you pay monthly to keep the protection active — like a subscription for peace of mind."`,
        ]
      : [
          `"Integrated shield covers hospitalisation; riders extend to pre/post hospital or specialist care."`,
          `"Compare co-payment vs premium — higher premium often means lower out-of-pocket at claim time."`,
          `"Suitability depends on your budget, existing Medisave/employer cover, and ward preference."`,
        ];

  const analogies = [
    { term: "Rider", analogy: "Add-on protection layer — like extra toppings on a base plan" },
    { term: "Premium", analogy: "Regular subscription fee to keep your protection active" },
    { term: "Co-payment", analogy: "Your share of the bill when a claim happens — like a deductible" },
  ];

  const misconceptionWarnings = [
    session.keyConcerns?.includes("High hospital bills")
      ? "Customer may assume basic employer plan is enough — clarify ward class and claim limits"
      : "Customer may underestimate long-term protection needs",
    familiarityMisconception(session.profile.insuranceFamiliarity),
    "Avoid guaranteeing claim outcomes — use illustrative scenarios only",
  ].filter(Boolean) as string[];

  const explanationPriority = [
    "1. Acknowledge concern and confirm understanding",
    "2. Explain base plan vs riders (if health)",
    `3. Compare ${products.slice(0, 2).map((p) => p.name).join(" vs ") || "Plan A vs Plan B"} on coverage and premium`,
    "4. Discuss affordability and next steps — no product recommendation",
    "5. Schedule follow-up if decision not ready",
  ];

  const comparisonHighlights = products.map(
    (p) => `${p.name}: ${p.covers.slice(0, 2).join(", ")} · $${p.premiumMin}–$${p.premiumMax}/mo`
  );

  return {
    talkingPoints,
    explainLikeThis,
    analogies,
    misconceptionWarnings,
    explanationPriority,
    comparisonHighlights: comparisonHighlights.length ? comparisonHighlights : [`${primary} — start with hospitalisation scenario`],
  };
}

function familiarityMisconception(familiarity?: CustomerProfile["insuranceFamiliarity"]): string {
  if (familiarity === "New to insurance") return "Customer may confuse premium with payout amount";
  if (familiarity === "Some experience") return "Customer may over-index on one feature (e.g. lowest premium)";
  return "Customer may expect definitive suitability answer — redirect to advisory process";
}

export function buildPostMeetingSummary(session: NavigatorSession, liveMessages: { role: string; content: string }[]): PostMeetingSummary {
  const customerMsgs = liveMessages.filter((m) => m.role === "user").map((m) => m.content);
  const topics = detectTopics(liveMessages.map((m) => m.content).join(" "));

  return {
    generatedAt: new Date().toISOString(),
    discussionSummary: customerMsgs.length
      ? `Consultation covered ${topics.join(", ") || "protection needs"}. Customer shared ${customerMsgs.length} message(s) during the session.`
      : "Consultation completed. Review intake summary for context.",
    prioritiesConfirmed: session.keyConcerns ?? [session.concern ?? "Protection needs"].filter(Boolean) as string[],
    plansDiscussed: session.matchedProducts.map((p) => p.name),
    remainingDoubts: session.remainingConcerns.length ? session.remainingConcerns : ["Decision timeline not confirmed"],
    recommendedFollowUp: session.profile.budgetPreference === "Budget-conscious"
      ? "Send premium comparison brochure and schedule follow-up in 1 week"
      : "Send plan comparison summary and offer second consultation",
    nextBestStep: topics.includes("affordability")
      ? "Compare Plan B with lower premium tier"
      : "Schedule follow-up to finalise suitability discussion",
  };
}

function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const topics: string[] = [];
  if (/premium|expensive|afford|cost|price/.test(lower)) topics.push("affordability");
  if (/rider|addon|add-on/.test(lower)) topics.push("riders");
  if (/hospital|ward|bill/.test(lower)) topics.push("hospitalisation");
  if (/cover|coverage|protect/.test(lower)) topics.push("coverage scope");
  if (/exclude|exclusion|claim/.test(lower)) topics.push("exclusions & claims");
  return topics;
}

export function buildPruAssistChatSummary(
  session: NavigatorSession,
  messages: { role: string; content: string }[]
): import("./types").PruAssistChatSummary {
  const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content);
  const allText = messages.map((m) => m.content).join(" ");
  const topics = detectTopics(allText);

  const topicLabels: Record<string, string> = {
    affordability: "Premium & affordability",
    riders: "Riders & add-ons",
    hospitalisation: "Hospitalisation coverage",
    "coverage scope": "What is covered",
    "exclusions & claims": "Exclusions & claims process",
  };

  const customerQuestions = userMsgs.filter((m) => m.includes("?") || /how|what|why|can i|should/i.test(m));
  const remainingQuestions = userMsgs.length
    ? ["Confirm decision timeline", "Any plan-specific exclusions to clarify"]
    : ["Customer has not started PruAssist chat yet"];

  const repTalkingPoints = [
    userMsgs.length
      ? `Customer asked about: ${customerQuestions.slice(0, 2).join("; ") || userMsgs[0]?.slice(0, 80)}`
      : "No PruAssist chat yet — rely on intake brief",
    topics.includes("affordability")
      ? "Address premium concerns with scenario-based hospitalisation example"
      : "Walk through coverage depth vs premium trade-offs",
    session.keyConcerns?.[0]
      ? `Top concern from intake: ${session.keyConcerns[0]}`
      : "Confirm primary protection need in live conversation",
  ];

  return {
    generatedAt: new Date().toISOString(),
    topicsDiscussed: topics.map((t) => topicLabels[t] ?? t),
    customerQuestions: customerQuestions.length ? customerQuestions.slice(0, 5) : ["No explicit questions recorded"],
    keyClarifications: userMsgs.length
      ? [`Discussed ${topics.length ? topics.join(", ") : "general insurance topics"} via PruAssist`]
      : [],
    remainingQuestions,
    repTalkingPoints,
    messageCount: messages.filter((m) => m.role === "user" || m.role === "assistant").length,
  };
}

export function matchProductsForIntake(session: NavigatorSession): MatchedProduct[] {
  const concernText = [
    session.consultationIntent,
    ...(session.keyConcerns ?? []),
    session.concern,
  ]
    .filter(Boolean)
    .join(". ");

  const insuranceType = session.insuranceType ?? intentToInsuranceType(session.consultationIntent);
  return matchProducts(concernText, insuranceType, session.profile);
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

  const insight = buildCustomerInsightSummary(session);
  const repBriefing = buildRepBriefing(session, insight);

  const needsIdentified = [
    session.consultationIntent ?? session.insuranceType ?? "Insurance consultation",
    ...(session.keyConcerns ?? []),
    session.concern,
  ].filter(Boolean) as string[];

  return {
    sessionId: session.id,
    generatedAt: new Date().toISOString(),
    customerInsight: insight,
    repBriefing,
    customerSummary: {
      needsIdentified,
      productsExplored: session.matchedProducts.map((p) => p.name),
      questionsAsked: session.questionsAsked,
      estimatedBudgetRange: budgetRanges.join("; ") || "Not calculated",
      remainingConcerns: session.remainingConcerns,
      confidenceLevel: session.confidenceLevel ?? "not recorded",
    },
    demographics: session.profile,
    protectionPriorities: insight.priorityMapping,
    plansConsidered: session.matchedProducts.map((p) => ({
      name: p.name,
      premiumRange: `$${p.premiumMin}–$${p.premiumMax}/month`,
      matchReason: p.matchReason,
    })),
    outstandingQuestions: [
      ...insight.likelyObjections.map((o) => `Anticipate objection: ${o}`),
      ...session.remainingConcerns,
    ],
    retentionNote: session.wantsFrHelp
      ? "Pre-consultation intake complete — Financial Representative briefed before meeting."
      : "Intake saved for future Financial Representative outreach.",
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
