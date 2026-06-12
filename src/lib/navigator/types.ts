export type ConsultationPhase =
  | "intake"
  | "intake_review"
  | "waiting"
  | "live"
  | "post_meeting";

/** @deprecated Legacy micro-steps — intake uses IntakeSection instead */
export type NavigatorStep =
  | "intent"
  | "insurance_type"
  | "profiling"
  | "concern"
  | "match"
  | "compare"
  | "confidence"
  | "decision"
  | "summary"
  | "chat"
  | "agent_chat";

export type IntakeSection =
  | "profile"
  | "financial"
  | "understanding"
  | "intent"
  | "concerns";

export type ConsultationIntent =
  | "Hospitalisation coverage"
  | "Critical illness"
  | "Investment-linked"
  | "Not sure yet";

export type KeyConcern =
  | "High hospital bills"
  | "Long-term protection"
  | "Affordability"
  | "Family protection";

export type TopIntent = "Insurance" | "Investments" | "Rewards" | "Priority programmes";

export type InsuranceType = "Health" | "Life" | "Accident" | "Critical illness";

export type AgeRange = "18-25" | "26-35" | "36-45" | "46-55" | "56+";
export type FamilySituation = "Single" | "Married, no children" | "Married with children" | "Supporting parents";
export type EmploymentType = "Employed" | "Self-employed" | "Student" | "Retired" | "Prefer not to say";
export type BudgetPreference = "Budget-conscious" | "Balanced" | "Premium coverage";
export type ExistingCoverage = "None" | "Basic employer plan" | "Integrated shield" | "Multiple policies";
export type EnglishProficiency = "Basic" | "Intermediate" | "Fluent";
export type InsuranceFamiliarity = "New to insurance" | "Some experience" | "Very familiar";

export type ConfidenceLevel = "confused" | "somewhat" | "confident";

export type CustomerProfile = {
  ageRange?: AgeRange;
  familySituation?: FamilySituation;
  employmentType?: EmploymentType;
  budgetPreference?: BudgetPreference;
  existingCoverage?: ExistingCoverage;
  englishProficiency?: EnglishProficiency;
  insuranceFamiliarity?: InsuranceFamiliarity;
};

export type InsuranceProduct = {
  id: string;
  name: string;
  type: InsuranceType;
  covers: string[];
  goodFor: string;
  limitations: string;
  keywords: string[];
  premiumBase: number;
  coverageLevel?: "Basic" | "Standard" | "Comprehensive";
};

export type MatchedProduct = InsuranceProduct & {
  premiumMin: number;
  premiumMax: number;
  matchReason: string;
};

export type NavigatorSession = {
  id: string;
  step: NavigatorStep;
  phase?: ConsultationPhase;
  intakeSection?: IntakeSection;
  topIntent?: TopIntent;
  insuranceType?: InsuranceType;
  consultationIntent?: ConsultationIntent;
  keyConcerns?: KeyConcern[];
  profile: CustomerProfile;
  concern?: string;
  matchedProducts: MatchedProduct[];
  confidenceLevel?: ConfidenceLevel;
  questionsAsked: string[];
  remainingConcerns: string[];
  wantsFrHelp: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RiskProfile = "high_concern_low_understanding" | "cost_sensitive" | "coverage_focused" | "informed_explorer";

export type CustomerInsightSummary = {
  riskProfile: RiskProfile;
  riskProfileLabel: string;
  priorityMapping: string[];
  likelyObjections: string[];
  recommendedDirection: string;
  explanationStyle: "simple" | "balanced" | "detailed";
  explanationStyleNote: string;
  rankedConcerns: { concern: string; rank: number }[];
};

export type RepBriefing = {
  talkingPoints: string[];
  explainLikeThis: string[];
  analogies: { term: string; analogy: string }[];
  misconceptionWarnings: string[];
  explanationPriority: string[];
  comparisonHighlights: string[];
};

export type PostMeetingSummary = {
  generatedAt: string;
  discussionSummary: string;
  prioritiesConfirmed: string[];
  plansDiscussed: string[];
  remainingDoubts: string[];
  recommendedFollowUp: string;
  nextBestStep: string;
};

export type FrHandoffDocument = {
  sessionId: string;
  generatedAt: string;
  customerInsight?: CustomerInsightSummary;
  repBriefing?: RepBriefing;
  customerSummary: {
    needsIdentified: string[];
    productsExplored: string[];
    questionsAsked: string[];
    estimatedBudgetRange: string;
    remainingConcerns: string[];
    confidenceLevel: ConfidenceLevel | "not recorded";
  };
  demographics: CustomerProfile;
  protectionPriorities: string[];
  plansConsidered: { name: string; premiumRange: string; matchReason: string }[];
  outstandingQuestions: string[];
  retentionNote: string;
};
