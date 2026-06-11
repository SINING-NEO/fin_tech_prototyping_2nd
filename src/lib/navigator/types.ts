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

export type TopIntent = "Insurance" | "Investments" | "Rewards" | "Priority programmes";

export type InsuranceType = "Health" | "Life" | "Accident" | "Critical illness";

export type AgeRange = "18-25" | "26-35" | "36-45" | "46-55" | "56+";
export type FamilySituation = "Single" | "Married, no children" | "Married with children" | "Supporting parents";
export type BudgetPreference = "Budget-conscious" | "Balanced" | "Premium coverage";
export type EnglishProficiency = "Basic" | "Intermediate" | "Fluent";
export type InsuranceFamiliarity = "New to insurance" | "Some experience" | "Very familiar";

export type ConfidenceLevel = "confused" | "somewhat" | "confident";

export type CustomerProfile = {
  ageRange?: AgeRange;
  familySituation?: FamilySituation;
  budgetPreference?: BudgetPreference;
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
};

export type MatchedProduct = InsuranceProduct & {
  premiumMin: number;
  premiumMax: number;
  matchReason: string;
};

export type NavigatorSession = {
  id: string;
  step: NavigatorStep;
  topIntent?: TopIntent;
  insuranceType?: InsuranceType;
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

export type FrHandoffDocument = {
  sessionId: string;
  generatedAt: string;
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
