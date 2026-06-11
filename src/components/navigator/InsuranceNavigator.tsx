"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { CustomerChat } from "@/components/CustomerChat";
import { SummaryPanel } from "./SummaryPanel";
import { LiveAgentChat } from "./LiveAgentChat";
import { syncCustomerSession, requestAgentChat } from "@/lib/navigator/session-api";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import type { FrHandoffDocument } from "@/lib/navigator/types";
import {
  TOP_INTENTS,
  INSURANCE_TYPES,
  PROFILING_OPTIONS,
  CONCERN_STARTERS,
} from "@/lib/navigator/products";
import {
  matchProducts,
  buildDecisionRationale,
  buildHandoffDocument,
  saveHandoffToStorage,
  downloadSummaryPdf,
  getAdaptiveQuestion,
  CONFIDENCE_OPTIONS,
} from "@/lib/navigator/engine";
import type {
  NavigatorSession,
  NavigatorStep,
  TopIntent,
  InsuranceType,
  CustomerProfile,
  ConfidenceLevel,
  MatchedProduct,
} from "@/lib/navigator/types";

function createSession(): NavigatorSession {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    step: "intent",
    profile: {},
    matchedProducts: [],
    questionsAsked: [],
    remainingConcerns: [],
    wantsFrHelp: false,
    createdAt: now,
    updatedAt: now,
  };
}

function Chip({
  label,
  onClick,
  selected,
}: {
  label: string;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs sm:text-sm px-3 py-2 rounded-full border transition-colors ${
        selected
          ? "bg-pru-red text-white border-pru-red"
          : "bg-white text-gray-700 border-pru-gray-border hover:border-pru-red hover:text-pru-red"
      }`}
    >
      {label}
    </button>
  );
}

function AssistantBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-pru-red flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[10px] font-bold">PA</span>
      </div>
      <div className="chat-bubble-assistant flex-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

interface InsuranceNavigatorProps {
  compact?: boolean;
}

const PROGRESS_LABELS = ["Intent", "Profile", "Match", "Compare", "Confidence", "Summary", "Chat"];

export function InsuranceNavigator({ compact = false }: InsuranceNavigatorProps) {
  const [session, setSession] = useState<NavigatorSession>(createSession);
  const [concernInput, setConcernInput] = useState("");
  const [adaptiveAnswer, setAdaptiveAnswer] = useState("");
  const [handoffSaved, setHandoffSaved] = useState(false);
  const [handoffDoc, setHandoffDoc] = useState<FrHandoffDocument | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handoff = handoffDoc ?? buildHandoffDocument(session);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.step, session.matchedProducts]);

  async function persistAndSync(
    s: NavigatorSession,
    status: "summary_ready" | "ai_chat" | "waiting_for_agent" = "summary_ready"
  ) {
    const doc = buildHandoffDocument(s);
    setHandoffDoc(doc);
    saveHandoffToStorage(doc);
    const result = await syncCustomerSession(s, status);
    if ("error" in result) {
      setSyncError(result.error);
      setHandoffSaved(false);
      return false;
    }
    setSyncError(null);
    setHandoffSaved(true);
    return true;
  }

  function goTo(step: NavigatorStep, patch: Partial<NavigatorSession> = {}) {
    setSession((s) => {
      const next = { ...s, step, ...patch, updatedAt: new Date().toISOString() };
      if (step === "summary") {
        void persistAndSync(next, "summary_ready");
      }
      return next;
    });
  }

  function selectIntent(intent: TopIntent) {
    if (intent !== "Insurance") {
      goTo("summary", {
        topIntent: intent,
        remainingConcerns: [`Customer selected ${intent} — route to specialist or FR.`],
      });
      return;
    }
    goTo("insurance_type", { topIntent: intent });
  }

  function selectInsuranceType(type: InsuranceType) {
    goTo("profiling", { insuranceType: type });
  }

  function updateProfile(patch: Partial<CustomerProfile>) {
    setSession((s) => ({
      ...s,
      profile: { ...s.profile, ...patch },
      updatedAt: new Date().toISOString(),
    }));
  }

  function profilingComplete() {
    const { profile } = session;
    if (!profile.ageRange || !profile.familySituation || !profile.budgetPreference) return;
    goTo("concern");
  }

  function submitConcern(text: string) {
    const concern = text.trim();
    if (!concern) return;
    const matched = matchProducts(concern, session.insuranceType, session.profile);
    const adaptive = getAdaptiveQuestion(session.profile, concern);
    const questions = [...session.questionsAsked];
    if (adaptive) questions.push(adaptive);

    goTo("compare", { concern, matchedProducts: matched, questionsAsked: questions });
  }

  function setConfidence(level: ConfidenceLevel) {
    if (level === "confused") {
      goTo("compare", {
        confidenceLevel: level,
        remainingConcerns: [...session.remainingConcerns, "Needs clearer explanation"],
      });
      return;
    }
    goTo("decision", { confidenceLevel: level });
  }

  function finishWithFrHelp(wantsHelp: boolean) {
    goTo("summary", { wantsFrHelp: wantsHelp });
  }

  async function startChatAfterSummary() {
    const next = { ...session, step: "chat" as const, updatedAt: new Date().toISOString() };
    setSession(next);
    await persistAndSync(next, "ai_chat");
  }

  async function startLiveAgentChat() {
    const next = { ...session, step: "agent_chat" as const, wantsFrHelp: true, updatedAt: new Date().toISOString() };
    setSession(next);
    const synced = await persistAndSync(next, "waiting_for_agent");
    if (synced) {
      await requestAgentChat(next.id);
    }
  }

  const px = compact ? "px-3" : "px-4";

  const progressIndex = (() => {
    const map: Record<NavigatorStep, number> = {
      intent: 0,
      insurance_type: 0,
      profiling: 1,
      concern: 2,
      match: 3,
      compare: 3,
      confidence: 4,
      decision: 5,
      summary: 5,
      chat: 6,
      agent_chat: 6,
    };
    return map[session.step];
  })();

  if (session.step === "agent_chat") {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className={`${px} py-2 bg-pru-gray-light border-b border-pru-gray-border flex-shrink-0 space-y-2`}>
          <p className="text-xs font-medium text-pru-gray-dark">Live chat with your Financial Representative</p>
          <ConnectionStatus role="customer" sessionId={session.id} />
          {syncError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
              Sync error: {syncError}. Ensure the dev server is running on the same port in both tabs.
            </p>
          )}
        </div>
        <div className={`${px} py-2 flex-shrink-0`}>
          <SummaryPanel handoff={handoff} compact={compact} />
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <LiveAgentChat sessionId={session.id} compact={compact} />
        </div>
        <div className={`${px} py-2 border-t border-pru-gray-border flex-shrink-0`}>
          <button type="button" onClick={() => startChatAfterSummary()} className="text-xs text-pru-red hover:underline">
            ← Back to PruAssist AI chat
          </button>
        </div>
      </div>
    );
  }

  if (session.step === "chat") {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className={`${px} py-2 bg-pru-gray-light border-b border-pru-gray-border flex-shrink-0`}>
          <div className="flex gap-1 overflow-x-auto text-[10px] text-gray-500">
            {PROGRESS_LABELS.map((label, i) => (
              <span
                key={label}
                className={`whitespace-nowrap px-2 py-0.5 rounded ${i <= 6 ? "bg-pru-red text-white" : "bg-white"}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className={`${px} py-2 flex-shrink-0 space-y-2`}>
          <SummaryPanel handoff={handoff} compact={compact} defaultOpen={false} />
          <button
            type="button"
            onClick={() => void startLiveAgentChat()}
            className="w-full text-xs border border-pru-gray-dark text-pru-gray-dark py-2 rounded-lg hover:bg-gray-50"
          >
            💬 Chat live with Financial Representative
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <CustomerChat
            compact={compact}
            postNavigator
            productLine={session.insuranceType ?? session.topIntent}
            handoffContext={handoff}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className={`${px} py-2 bg-pru-gray-light border-b border-pru-gray-border flex-shrink-0`}>
        <div className="flex gap-1 overflow-x-auto text-[10px] text-gray-500">
          {PROGRESS_LABELS.slice(0, 6).map((label, i) => (
            <span
              key={label}
              className={`whitespace-nowrap px-2 py-0.5 rounded ${progressIndex >= i ? "bg-pru-red text-white" : "bg-white"}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${px} py-4`}>
        {session.step === "intent" && (
          <>
            <AssistantBlock>
              <p className="font-medium text-pru-gray-dark">What can I help you with today?</p>
              <p className="mt-2 text-gray-600 text-xs">
                I&apos;ll explain options in plain language and prepare you for your Financial Representative.
              </p>
            </AssistantBlock>
            <div className="flex flex-wrap gap-2 ml-10">
              {TOP_INTENTS.map((i) => (
                <Chip key={i} label={i} onClick={() => selectIntent(i)} />
              ))}
            </div>
          </>
        )}

        {session.step === "insurance_type" && (
          <>
            <AssistantBlock>
              <p>Great — let&apos;s explore <strong>Insurance</strong>. Which area are you interested in?</p>
            </AssistantBlock>
            <div className="flex flex-wrap gap-2 ml-10">
              {INSURANCE_TYPES.map((t) => (
                <Chip key={t} label={t} onClick={() => selectInsuranceType(t)} />
              ))}
            </div>
          </>
        )}

        {session.step === "profiling" && (
          <>
            <AssistantBlock>
              <p>A few quick questions so I can adapt my explanations to you.</p>
            </AssistantBlock>
            <div className="ml-10 space-y-4 text-sm">
              <ProfileField label="Age range" options={PROFILING_OPTIONS.ageRange} value={session.profile.ageRange} onChange={(v) => updateProfile({ ageRange: v as CustomerProfile["ageRange"] })} />
              <ProfileField label="Family situation" options={PROFILING_OPTIONS.familySituation} value={session.profile.familySituation} onChange={(v) => updateProfile({ familySituation: v as CustomerProfile["familySituation"] })} />
              <ProfileField label="Budget preference" options={PROFILING_OPTIONS.budgetPreference} value={session.profile.budgetPreference} onChange={(v) => updateProfile({ budgetPreference: v as CustomerProfile["budgetPreference"] })} />
              <ProfileField label="English proficiency" options={PROFILING_OPTIONS.englishProficiency} value={session.profile.englishProficiency} onChange={(v) => updateProfile({ englishProficiency: v as CustomerProfile["englishProficiency"] })} />
              <ProfileField label="Insurance familiarity" options={PROFILING_OPTIONS.insuranceFamiliarity} value={session.profile.insuranceFamiliarity} onChange={(v) => updateProfile({ insuranceFamiliarity: v as CustomerProfile["insuranceFamiliarity"] })} />
              <button type="button" onClick={profilingComplete} disabled={!session.profile.ageRange || !session.profile.familySituation || !session.profile.budgetPreference} className="btn-primary text-sm disabled:opacity-40">
                Continue →
              </button>
            </div>
          </>
        )}

        {session.step === "concern" && (
          <>
            <AssistantBlock>
              <p>What protection are you looking for? Tell me in your own words.</p>
              <p className="text-xs text-gray-500 mt-1">e.g. &quot;I&apos;m worried about hospital bills&quot;</p>
            </AssistantBlock>
            <div className="ml-10 flex flex-wrap gap-2 mb-3">
              {CONCERN_STARTERS.map((c) => (
                <Chip key={c} label={c} onClick={() => submitConcern(c)} />
              ))}
            </div>
            <form className="ml-10 flex gap-2" onSubmit={(e) => { e.preventDefault(); submitConcern(concernInput); }}>
              <input value={concernInput} onChange={(e) => setConcernInput(e.target.value)} placeholder="Describe your concern..." className="flex-1 border border-pru-gray-border rounded-full px-3 py-2 text-sm" />
              <button type="submit" className="btn-primary text-sm px-4 py-2">Match</button>
            </form>
          </>
        )}

        {(session.step === "compare" || session.step === "match") && (
          <>
            <AssistantBlock>
              <p>Based on &quot;{session.concern}&quot;, here are plans that may align with your needs. Premiums are <strong>estimated</strong> for your profile.</p>
            </AssistantBlock>
            <div className="ml-10 space-y-3">
              {session.matchedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {getAdaptiveQuestion(session.profile, session.concern) && session.confidenceLevel !== "confused" && (
              <div className="ml-10 mt-4 p-3 bg-amber-50 rounded-lg text-sm border border-amber-100">
                <p className="font-medium text-amber-900">Adaptive question</p>
                <p className="text-amber-800 mt-1">{getAdaptiveQuestion(session.profile, session.concern)}</p>
                <input value={adaptiveAnswer} onChange={(e) => setAdaptiveAnswer(e.target.value)} className="mt-2 w-full border rounded px-2 py-1 text-xs" placeholder="Optional — share your thoughts" />
              </div>
            )}
            <div className="ml-10 mt-4">
              <button type="button" onClick={() => goTo("confidence")} className="btn-primary text-sm">
                I&apos;ve reviewed these — continue →
              </button>
            </div>
          </>
        )}

        {session.step === "confidence" && (
          <>
            <AssistantBlock>
              <p className="font-medium">How confident do you feel about your understanding of these plans?</p>
            </AssistantBlock>
            <div className="ml-10 flex flex-wrap gap-2">
              {CONFIDENCE_OPTIONS.map((opt) => (
                <button key={opt.level} type="button" onClick={() => setConfidence(opt.level)} className="flex items-center gap-2 px-4 py-3 rounded-lg border border-pru-gray-border bg-white hover:border-pru-red text-sm">
                  <span className="text-xl">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {session.step === "decision" && (
          <>
            <AssistantBlock>
              <p className="font-medium text-pru-gray-dark">Based on what you&apos;ve shared</p>
              <p className="mt-2">{buildDecisionRationale(session)}</p>
            </AssistantBlock>
            <div className="ml-10 mt-3 space-y-2 text-sm">
              <h4 className="font-semibold">Estimated premium ranges</h4>
              {session.matchedProducts.map((p) => (
                <p key={p.id} className="text-gray-700"><strong>{p.name}:</strong> ${p.premiumMin}–${p.premiumMax}/month</p>
              ))}
              <h4 className="font-semibold mt-3">Key trade-offs</h4>
              <ul className="list-disc ml-4 text-gray-600 space-y-1">
                {session.matchedProducts.map((p) => (
                  <li key={p.id}>{p.name}: {p.limitations}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 mt-3 italic">These are illustrative options — your Financial Representative confirms suitability.</p>
            </div>
            <div className="ml-10 mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => finishWithFrHelp(true)} className="btn-primary text-sm">
                Connect me with my Financial Representative
              </button>
              <button type="button" onClick={() => finishWithFrHelp(false)} className="btn-secondary text-sm">
                Save summary — I&apos;ll decide later
              </button>
            </div>
          </>
        )}

        {session.step === "summary" && (
          <>
            <AssistantBlock>
              <p className="font-medium">Your summary is ready</p>
              {session.topIntent && session.topIntent !== "Insurance" ? (
                <p className="mt-2">For <strong>{session.topIntent}</strong>, a Financial Representative will follow up with you. We&apos;ve noted your interest.</p>
              ) : (
                <p className="mt-2">
                  {session.wantsFrHelp
                    ? "Your session summary will be shared with your assigned Financial Representative. You can keep chatting with me below if you have more questions."
                    : "Your session has been saved. You can keep chatting with me for any follow-up questions."}
                </p>
              )}
            </AssistantBlock>
            <div className={`ml-10 mb-4`}>
              <SummaryPanel handoff={handoff} compact={compact} defaultOpen />
            </div>
            <div className="ml-10 space-y-3">
              <button
                type="button"
                onClick={() => downloadSummaryPdf(handoff)}
                className="btn-secondary text-sm w-full sm:w-auto"
              >
                Download my summary
              </button>
              <button
                type="button"
                onClick={() => void startLiveAgentChat()}
                className="w-full sm:w-auto bg-pru-gray-dark hover:bg-black text-white font-medium text-sm px-5 py-2.5 rounded-full transition-colors block"
              >
                Chat live with Financial Representative →
              </button>
              <button type="button" onClick={() => void startChatAfterSummary()} className="btn-primary text-sm block w-full sm:w-auto">
                Keep chatting with PruAssist →
              </button>
              <button type="button" onClick={() => { setSession(createSession()); setHandoffSaved(false); setHandoffDoc(null); }} className="block text-sm text-gray-500 hover:text-pru-red">
                Start a new session
              </button>
            </div>
            {syncError && (
              <p className="ml-10 mt-3 text-xs text-red-600">Could not sync to agent queue: {syncError}</p>
            )}
            {handoffSaved && !syncError && (
              <p className="ml-10 mt-3 text-xs text-green-700">Session synced — visible in agent queue.</p>
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {!compact && session.step !== "summary" && (
        <p className="text-xs text-gray-400 text-center py-2 border-t border-pru-gray-border">
          Customer view — your Financial Representative uses a separate advisor workspace
        </p>
      )}
    </div>
  );
}

function ProfileField({ label, options, value, onChange }: { label: string; options: readonly string[]; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Chip key={o} label={o} selected={value === o} onClick={() => onChange(o)} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: MatchedProduct }) {
  return (
    <div className="border border-pru-gray-border rounded-lg p-4 bg-white shadow-sm text-sm">
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-bold text-pru-gray-dark">{product.name}</h4>
        <span className="text-xs bg-pru-red-light text-pru-red px-2 py-0.5 rounded-full whitespace-nowrap">
          ${product.premiumMin}–${product.premiumMax}/mo
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{product.type}</p>
      <div className="mt-3 grid gap-2 text-xs text-gray-700">
        <p><strong>Covers:</strong> {product.covers.join(" · ")}</p>
        <p><strong>Good for:</strong> {product.goodFor}</p>
        <p><strong>Limitations:</strong> {product.limitations}</p>
      </div>
    </div>
  );
}
