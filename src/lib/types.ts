export type KnowledgeCategory =
  | "life-insurance"
  | "annuities"
  | "claims"
  | "policy-servicing"
  | "online-access"
  | "compliance";

export interface KnowledgeArticle {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  keywords: string[];
  agentNotes?: string;
  complianceTags?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface RetrievedContext {
  article: KnowledgeArticle;
  score: number;
}

export interface ChatResponse {
  message: string;
  sources: RetrievedContext[];
  suggestedFollowUps?: string[];
  escalateToHuman?: boolean;
  escalationReason?: string;
}

export interface CopilotSuggestion {
  type: "response_draft" | "next_action" | "knowledge" | "compliance" | "summary" | "plain_language" | "suitability";
  title: string;
  content: string;
  priority: "high" | "medium" | "low";
}

export interface CopilotResponse {
  suggestions: CopilotSuggestion[];
  retrievedArticles: RetrievedContext[];
  customerSentiment?: "positive" | "neutral" | "concerned" | "distressed";
  recommendedDisposition?: string;
}

export type ChatMode = "customer" | "agent";

export type CustomerChatVariant = "general" | "fr_prep";

export type CopilotVariant = "session" | "general";

export interface ChatRequest {
  messages: ChatMessage[];
  mode: ChatMode;
  variant?: CustomerChatVariant;
  sessionContext?: {
    policyNumber?: string;
    productLine?: string;
    customerName?: string;
    summarySnippet?: string;
  };
}
