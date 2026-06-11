import { KNOWLEDGE_BASE } from "./knowledge";
import type { KnowledgeArticle, RetrievedContext } from "./types";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreArticle(query: string, article: KnowledgeArticle): number {
  const queryTokens = new Set(tokenize(query));
  const titleTokens = tokenize(article.title);
  const contentTokens = tokenize(article.content);
  const keywordTokens = article.keywords.map((k) => k.toLowerCase());

  let score = 0;

  for (const token of queryTokens) {
    if (keywordTokens.some((k) => k.includes(token) || token.includes(k))) {
      score += 4;
    }
    if (titleTokens.includes(token)) score += 3;
    if (contentTokens.includes(token)) score += 1;
  }

  const queryLower = query.toLowerCase();
  for (const keyword of keywordTokens) {
    if (queryLower.includes(keyword)) score += 5;
  }

  if (article.category && queryLower.includes(article.category.replace("-", " "))) {
    score += 2;
  }

  return score;
}

export function retrieveContext(
  query: string,
  topK = 4,
  categoryFilter?: string
): RetrievedContext[] {
  const articles = categoryFilter
    ? KNOWLEDGE_BASE.filter((a) => a.category === categoryFilter)
    : KNOWLEDGE_BASE;

  return articles
    .map((article) => ({ article, score: scoreArticle(query, article) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function formatContextForPrompt(contexts: RetrievedContext[]): string {
  if (contexts.length === 0) {
    return "No specific knowledge articles matched this query.";
  }

  return contexts
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.article.title} (${c.article.category})]\n${c.article.content}${
          c.article.agentNotes ? `\nAgent note: ${c.article.agentNotes}` : ""
        }`
    )
    .join("\n\n---\n\n");
}

export function detectEscalationTriggers(text: string): {
  shouldEscalate: boolean;
  reason?: string;
} {
  const lower = text.toLowerCase();
  const triggers: { pattern: RegExp; reason: string }[] = [
    {
      pattern: /death claim|passed away|deceased|funeral|bereavement/,
      reason: "Sensitive death claim inquiry — human empathy required",
    },
    {
      pattern: /lawyer|attorney|legal action|sue|lawsuit|complaint to state/,
      reason: "Legal or regulatory escalation language detected",
    },
    {
      pattern: /fraud|stolen identity|unauthorized/,
      reason: "Potential fraud concern — verify identity with specialist",
    },
    {
      pattern: /suicid|self.?harm|emergency/,
      reason: "Crisis-related language — immediate human handoff",
    },
    {
      pattern: /which (policy|plan|product)|what should i (buy|get)|is this (right|suitable) for me|recommend|best (policy|plan|coverage)/,
      reason: "Suitability question — connect with Financial Representative for personalized guidance",
    },
    {
      pattern: /speak to (a )?(person|human|agent|representative|advisor|someone real)/,
      reason: "Customer explicitly requested a human representative",
    },
  ];

  for (const { pattern, reason } of triggers) {
    if (pattern.test(lower)) {
      return { shouldEscalate: true, reason };
    }
  }

  return { shouldEscalate: false };
}

export function inferSentiment(
  messages: { role: string; content: string }[]
): "positive" | "neutral" | "concerned" | "distressed" {
  const recentUser = messages
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content.toLowerCase())
    .join(" ");

  if (/thank|appreciate|great|helpful|wonderful/.test(recentUser)) return "positive";
  if (/worried|confused|frustrated|upset|angry|don't understand|help me/.test(recentUser))
    return "concerned";
  if (/death|passed away|emergency|urgent|desperate/.test(recentUser)) return "distressed";
  return "neutral";
}
