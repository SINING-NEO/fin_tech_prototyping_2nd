"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { LiveAgentChat } from "./LiveAgentChat";
import { PlanComparisonInfographic } from "./PlanComparisonInfographic";
import { PostMeetingSummaryPanel } from "./PostMeetingSummaryPanel";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { syncCustomerSession, requestAgentChat } from "@/lib/navigator/session-api";
import {
  INTAKE_SECTIONS,
  CONSULTATION_INTENTS,
  KEY_CONCERNS,
  PROFILING_OPTIONS,
} from "@/lib/navigator/products";
import {
  buildHandoffDocument,
  matchProductsForIntake,
  intentToInsuranceType,
  downloadSummaryPdf,
  saveHandoffToStorage,
} from "@/lib/navigator/engine";
import type {
  NavigatorSession,
  IntakeSection,
  ConsultationPhase,
  ConsultationIntent,
  KeyConcern,
  CustomerProfile,
  FrHandoffDocument,
  PostMeetingSummary,
} from "@/lib/navigator/types";

const WORKFLOW_STEPS = [
  { phase: "intake" as const, label: "Pre-consultation intake", color: "bg-blue-600" },
  { phase: "waiting" as const, label: "Rep briefing", color: "bg-amber-500" },
  { phase: "live" as const, label: "Live consultation", color: "bg-green-600" },
  { phase: "post_meeting" as const, label: "Post-meeting summary", color: "bg-purple-600" },
];

function createSession(): NavigatorSession {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    step: "summary",
    phase: "intake",
    intakeSection: "profile",
    profile: {},
    keyConcerns: [],
    matchedProducts: [],
    questionsAsked: [],
    remainingConcerns: [],
    wantsFrHelp: true,
    createdAt: now,
    updatedAt: now,
  };
}

function Chip({ label, onClick, selected }: { label: string; onClick: () => void; selected?: boolean }) {
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

interface InsuranceNavigatorProps {
  compact?: boolean;
}

export function InsuranceNavigator({ compact = false }: InsuranceNavigatorProps) {
  const [session, setSession] = useState<NavigatorSession>(createSession);
  const [handoffDoc, setHandoffDoc] = useState<FrHandoffDocument | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [postSummary, setPostSummary] = useState<PostMeetingSummary | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const phase: ConsultationPhase = session.phase ?? "intake";
  const intakeSection = session.intakeSection ?? "profile";
  const handoff = handoffDoc ?? (session.matchedProducts.length ? buildHandoffDocument(session) : null);
  const px = compact ? "px-3" : "px-4";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [phase, intakeSection]);

  useEffect(() => {
    if (phase !== "live" && phase !== "post_meeting") return;
    async function poll() {
      try {
        const res = await fetch(`/api/sessions/${session.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.session?.status === "closed" && data.session?.postMeetingSummary) {
          setPostSummary(data.session.postMeetingSummary);
          setSession((s) => ({ ...s, phase: "post_meeting" }));
        } else if (data.session?.status === "live_with_agent" && phase === "waiting") {
          setSession((s) => ({ ...s, phase: "live" }));
        }
      } catch {
        /* ignore */
      }
    }
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [session.id, phase]);

  function updateProfile(patch: Partial<CustomerProfile>) {
    setSession((s) => ({
      ...s,
      profile: { ...s.profile, ...patch },
      updatedAt: new Date().toISOString(),
    }));
  }

  function toggleConcern(concern: KeyConcern) {
    setSession((s) => {
      const current = s.keyConcerns ?? [];
      const next = current.includes(concern)
        ? current.filter((c) => c !== concern)
        : [...current, concern];
      return { ...s, keyConcerns: next, updatedAt: new Date().toISOString() };
    });
  }

  function goIntakeSection(section: IntakeSection) {
    setSession((s) => ({ ...s, intakeSection: section, updatedAt: new Date().toISOString() }));
  }

  function nextSection() {
    const order: IntakeSection[] = ["profile", "financial", "understanding", "intent", "concerns"];
    const idx = order.indexOf(intakeSection);
    if (idx < order.length - 1) goIntakeSection(order[idx + 1]);
  }

  function prevSection() {
    const order: IntakeSection[] = ["profile", "financial", "understanding", "intent", "concerns"];
    const idx = order.indexOf(intakeSection);
    if (idx > 0) goIntakeSection(order[idx - 1]);
  }

  function canProceedSection(): boolean {
    const { profile, consultationIntent, keyConcerns } = session;
    switch (intakeSection) {
      case "profile":
        return Boolean(profile.ageRange && profile.familySituation);
      case "financial":
        return Boolean(profile.budgetPreference);
      case "understanding":
        return Boolean(profile.insuranceFamiliarity && profile.englishProficiency);
      case "intent":
        return Boolean(consultationIntent);
      case "concerns":
        return (keyConcerns?.length ?? 0) > 0;
      default:
        return false;
    }
  }

  async function completeIntake() {
    const insuranceType = intentToInsuranceType(session.consultationIntent);
    const matched = matchProductsForIntake({ ...session, insuranceType });
    const next: NavigatorSession = {
      ...session,
      insuranceType,
      matchedProducts: matched,
      concern: session.keyConcerns?.[0],
      phase: "intake_review",
      updatedAt: new Date().toISOString(),
    };
    setSession(next);
    const doc = buildHandoffDocument(next);
    setHandoffDoc(doc);
  }

  async function bookConsultation() {
    const next: NavigatorSession = {
      ...session,
      phase: "waiting",
      wantsFrHelp: true,
      updatedAt: new Date().toISOString(),
    };
    setSession(next);
    const doc = buildHandoffDocument(next);
    setHandoffDoc(doc);
    saveHandoffToStorage(doc);
    const result = await syncCustomerSession(next, "waiting_for_agent");
    if ("error" in result) {
      setSyncError(result.error);
      return;
    }
    setSyncError(null);
    await requestAgentChat(next.id);
  }

  async function joinLiveConsultation() {
    setSession((s) => ({ ...s, phase: "live", updatedAt: new Date().toISOString() }));
  }

  const workflowIndex = phase === "intake" || phase === "intake_review" ? 0 : phase === "waiting" ? 1 : phase === "live" ? 2 : 3;

  if (phase === "post_meeting" && postSummary) {
    return (
      <div className={`flex flex-col h-full bg-white overflow-y-auto ${px} py-4`}>
        <PostMeetingSummaryPanel summary={postSummary} sessionId={session.id} role="customer" />
      </div>
    );
  }

  if (phase === "live") {
    return (
      <div className="flex flex-col h-full bg-white">
        <WorkflowHeader workflowIndex={2} px={px} />
        <div className={`${px} py-2 bg-green-50 border-b border-green-100 flex-shrink-0 space-y-2`}>
          <p className="text-xs font-medium text-green-900">Step 3 · Live consultation with your Financial Representative</p>
          <ConnectionStatus role="customer" sessionId={session.id} />
          <p className="text-[10px] text-green-700">
            AI supports your rep with real-time transcription analysis — clearer, more consistent consultations.
          </p>
        </div>
        <div className="flex-1 min-h-0">
          <LiveAgentChat sessionId={session.id} compact={compact} />
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className={`flex flex-col h-full bg-white overflow-y-auto ${px} py-4`}>
        <WorkflowHeader workflowIndex={1} px={px} />
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-medium text-amber-900 uppercase tracking-wide">Consultation booked</p>
          <h3 className="font-bold text-lg text-amber-950 mt-1">Your Financial Representative is preparing</h3>
          <p className="text-sm text-amber-800 mt-2 leading-relaxed">
            Your guided intake has been synthesised into a pre-meeting brief. Share this Session ID if needed:
          </p>
          <p className="mt-3 font-mono text-sm bg-white border border-amber-200 rounded-lg px-3 py-2 text-pru-red font-bold select-all">
            {session.id}
          </p>
          <ConnectionStatus role="customer" sessionId={session.id} />
          {syncError && <p className="text-xs text-red-600 mt-2">{syncError}</p>}
        </div>
        {handoff && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-500">Preview of what your rep sees:</p>
            {handoff.customerInsight && (
              <div className="border rounded-xl p-3 bg-white text-xs">
                <p className="font-medium text-pru-gray-dark">AI insight (behind the scenes)</p>
                <p className="mt-1 text-gray-600">{handoff.customerInsight.riskProfileLabel}</p>
              </div>
            )}
            <PlanComparisonInfographic products={session.matchedProducts} compact />
          </div>
        )}
        <button type="button" onClick={() => void joinLiveConsultation()} className="btn-primary w-full mt-4 text-sm">
          Join live consultation when rep is ready →
        </button>
      </div>
    );
  }

  if (phase === "intake_review" && handoff) {
    const insight = handoff.customerInsight;
    return (
      <div className={`flex flex-col h-full bg-white overflow-y-auto ${px} py-4`}>
        <WorkflowHeader workflowIndex={0} px={px} />
        <div className="mt-4">
          <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Intake complete</p>
          <h3 className="font-bold text-lg text-pru-gray-dark mt-1">Your consultation brief is ready</h3>
          <p className="text-sm text-gray-600 mt-2">
            AI synthesised your responses into a Customer Insight Summary for your Financial Representative.
          </p>
        </div>

        {insight && (
          <div className="mt-4 border border-blue-200 rounded-xl p-4 bg-blue-50 text-sm">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              <span>🧠</span> Customer Insight Summary
            </h4>
            <p className="mt-2 text-xs text-blue-800">{insight.riskProfileLabel}</p>
            <div className="mt-3 grid gap-2 text-xs text-blue-900">
              <p><strong>Direction:</strong> {insight.recommendedDirection}</p>
              <p><strong>Style:</strong> {insight.explanationStyleNote}</p>
              <p><strong>Priorities:</strong> {insight.priorityMapping.join(" · ")}</p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <PlanComparisonInfographic products={session.matchedProducts} />
        </div>

        <div className="mt-4 space-y-2">
          <button type="button" onClick={() => void bookConsultation()} className="btn-primary w-full text-sm">
            Book consultation with Financial Representative →
          </button>
          <button type="button" onClick={() => downloadSummaryPdf(handoff)} className="btn-secondary w-full text-sm">
            Download intake summary
          </button>
          <button type="button" onClick={() => setSession((s) => ({ ...s, phase: "intake", intakeSection: "profile" }))} className="text-xs text-gray-500 hover:text-pru-red w-full">
            ← Edit intake responses
          </button>
        </div>
      </div>
    );
  }

  const sectionMeta = INTAKE_SECTIONS.find((s) => s.id === intakeSection)!;
  const sectionIndex = INTAKE_SECTIONS.findIndex((s) => s.id === intakeSection);

  return (
    <div className="flex flex-col h-full bg-white">
      <WorkflowHeader workflowIndex={0} px={px} />

      <div className={`${px} py-3 bg-blue-50 border-b border-blue-100 flex-shrink-0`}>
        <p className="text-[10px] font-medium text-blue-700 uppercase tracking-wide">
          Step 1 · Pre-consultation intake
        </p>
        <h2 className="font-semibold text-pru-gray-dark text-sm mt-0.5">Guided intake form with AI synthesis</h2>
        <p className="text-xs text-blue-800/80 mt-1">
          Structured questionnaire — not a chatbot. Your Financial Representative receives a prepared brief.
        </p>
        <div className="flex gap-1 mt-3 overflow-x-auto">
          {INTAKE_SECTIONS.map((s, i) => (
            <span
              key={s.id}
              className={`whitespace-nowrap text-[10px] px-2 py-1 rounded-full ${
                i <= sectionIndex ? "bg-blue-600 text-white" : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {s.step}. {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${px} py-4`}>
        <h3 className="font-medium text-pru-gray-dark mb-1">{sectionMeta.label}</h3>
        <p className="text-xs text-gray-500 mb-4">Section {sectionMeta.step} of 5</p>

        {intakeSection === "profile" && (
          <div className="space-y-4 text-sm">
            <FieldGroup label="Age range" options={PROFILING_OPTIONS.ageRange} value={session.profile.ageRange} onChange={(v) => updateProfile({ ageRange: v as CustomerProfile["ageRange"] })} />
            <FieldGroup label="Family situation" options={PROFILING_OPTIONS.familySituation} value={session.profile.familySituation} onChange={(v) => updateProfile({ familySituation: v as CustomerProfile["familySituation"] })} />
            <FieldGroup label="Employment type (optional)" options={PROFILING_OPTIONS.employmentType} value={session.profile.employmentType} onChange={(v) => updateProfile({ employmentType: v as CustomerProfile["employmentType"] })} optional />
          </div>
        )}

        {intakeSection === "financial" && (
          <div className="space-y-4 text-sm">
            <FieldGroup label="Budget preference" options={PROFILING_OPTIONS.budgetPreference} value={session.profile.budgetPreference} onChange={(v) => updateProfile({ budgetPreference: v as CustomerProfile["budgetPreference"] })} />
            <FieldGroup label="Existing insurance coverage" options={PROFILING_OPTIONS.existingCoverage} value={session.profile.existingCoverage} onChange={(v) => updateProfile({ existingCoverage: v as CustomerProfile["existingCoverage"] })} />
          </div>
        )}

        {intakeSection === "understanding" && (
          <div className="space-y-4 text-sm">
            <FieldGroup label="Insurance familiarity" options={PROFILING_OPTIONS.insuranceFamiliarity} value={session.profile.insuranceFamiliarity} onChange={(v) => updateProfile({ insuranceFamiliarity: v as CustomerProfile["insuranceFamiliarity"] })} />
            <FieldGroup label="English proficiency (for explanation style)" options={PROFILING_OPTIONS.englishProficiency} value={session.profile.englishProficiency} onChange={(v) => updateProfile({ englishProficiency: v as CustomerProfile["englishProficiency"] })} />
          </div>
        )}

        {intakeSection === "intent" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">What are you looking for?</p>
            <div className="flex flex-wrap gap-2">
              {CONSULTATION_INTENTS.map((intent) => (
                <Chip
                  key={intent}
                  label={intent}
                  selected={session.consultationIntent === intent}
                  onClick={() =>
                    setSession((s) => ({
                      ...s,
                      consultationIntent: intent as ConsultationIntent,
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                />
              ))}
            </div>
          </div>
        )}

        {intakeSection === "concerns" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">What worries you most? (select all that apply)</p>
            <div className="flex flex-wrap gap-2">
              {KEY_CONCERNS.map((c) => (
                <Chip key={c} label={c} selected={session.keyConcerns?.includes(c)} onClick={() => toggleConcern(c)} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className={`${px} py-3 border-t border-pru-gray-border flex gap-2 flex-shrink-0`}>
        {sectionIndex > 0 && (
          <button type="button" onClick={prevSection} className="btn-secondary text-sm flex-1">
            ← Back
          </button>
        )}
        {intakeSection !== "concerns" ? (
          <button type="button" onClick={nextSection} disabled={!canProceedSection()} className="btn-primary text-sm flex-1 disabled:opacity-40">
            Continue →
          </button>
        ) : (
          <button type="button" onClick={() => void completeIntake()} disabled={!canProceedSection()} className="btn-primary text-sm flex-1 disabled:opacity-40">
            Generate AI insight →
          </button>
        )}
      </div>
    </div>
  );
}

function WorkflowHeader({ workflowIndex, px }: { workflowIndex: number; px: string }) {
  return (
    <div className={`${px} py-2 bg-pru-gray-light border-b border-pru-gray-border flex-shrink-0`}>
      <div className="flex gap-1 overflow-x-auto text-[10px]">
        {WORKFLOW_STEPS.map((step, i) => (
          <span
            key={step.phase}
            className={`whitespace-nowrap px-2 py-1 rounded text-white ${i <= workflowIndex ? step.color : "bg-gray-300"}`}
          >
            {i + 1}. {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  options,
  value,
  onChange,
  optional,
}: {
  label: string;
  options: readonly string[];
  value?: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1.5">
        {label}{optional ? " (optional)" : ""}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Chip key={o} label={o} selected={value === o} onClick={() => onChange(o)} />
        ))}
      </div>
    </div>
  );
}
