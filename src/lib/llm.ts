import OpenAI from "openai";
import {
  CUSTOMER_SYSTEM_PROMPT,
  FR_PREP_SYSTEM_PROMPT,
  AGENT_COPILOT_SYSTEM_PROMPT,
  REP_DESK_SYSTEM_PROMPT,
  MOCK_CUSTOMER_RESPONSES,
  MOCK_FR_PREP_RESPONSES,
} from "./prompts";
import {
  retrieveContext,
  formatContextForPrompt,
  detectEscalationTriggers,
  inferSentiment,
} from "./rag";
import type {
  ChatMessage,
  ChatResponse,
  CopilotResponse,
  CopilotSuggestion,
  CustomerChatVariant,
  CopilotVariant,
} from "./types";

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-your")) return null;
  return new OpenAI({ apiKey });
}

function useMockLLM(): boolean {
  return (
    process.env.USE_MOCK_LLM === "true" || !getOpenAIClient()
  );
}

function getLastUserMessage(messages: ChatMessage[]): string {
  return [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
}

function mockFrPrepResponse(query: string): ChatResponse {
  const lower = query.toLowerCase();
  let message = MOCK_FR_PREP_RESPONSES.default;
  if (/video|zoom|teams|call|camera|online/.test(lower)) message = MOCK_FR_PREP_RESPONSES.video;
  else if (/prepare|bring|document|checklist|ready|before/.test(lower)) message = MOCK_FR_PREP_RESPONSES.prepare;
  else if (/difference|pruassist|ai|vs|between/.test(lower)) message = MOCK_FR_PREP_RESPONSES.difference;

  return {
    message,
    sources: [],
    suggestedFollowUps: [
      "What questions should I ask my rep?",
      "How do I join the video call?",
      "What happens after the consultation?",
    ],
    escalateToHuman: false,
  };
}

function mockCustomerResponse(query: string, contexts: ReturnType<typeof retrieveContext>): ChatResponse {
  const lower = query.toLowerCase();
  let message = MOCK_CUSTOMER_RESPONSES.default;

  if (/pay|payment|premium|bill/.test(lower)) message = MOCK_CUSTOMER_RESPONSES.payment;
  else if (/death|claim|passed|deceased|funeral/.test(lower)) message = MOCK_CUSTOMER_RESPONSES.claim;
  else if (/suitable|recommend|which policy|right for me|what should i buy|best plan|compare/.test(lower))
    message = MOCK_CUSTOMER_RESPONSES.suitability;
  else if (/policy|value|cash|beneficiary|loan|explain|simple|plain|jargon/.test(lower))
    message = MOCK_CUSTOMER_RESPONSES.policy;
  else if (contexts.length > 0) {
    const top = contexts[0].article;
    message = `Great question about ${top.title.toLowerCase()}. ${top.content.split(".")[0]}. Would you like me to explain the steps, or is there a specific part you'd like help with?`;
  }

  const escalation = detectEscalationTriggers(query);

  return {
    message,
    sources: contexts,
    suggestedFollowUps: [
      "Can you walk me through the steps?",
      "What phone number should I call?",
      "I'd like to speak with a representative",
    ],
    escalateToHuman: escalation.shouldEscalate,
    escalationReason: escalation.reason,
  };
}

function mockGeneralRepResponse(
  query: string,
  contexts: ReturnType<typeof retrieveContext>
): CopilotResponse {
  const lower = query.toLowerCase();
  const suggestions: CopilotSuggestion[] = [];

  if (/cash value|cash-value/.test(lower)) {
    suggestions.push({
      type: "plain_language",
      title: "Cash value — plain language",
      content:
        "Cash value is the savings portion inside some permanent policies. Think of it like a built-in account that grows over time — you can access it through loans or withdrawals, but that can affect your death benefit. Always mention tax and loan interest implications.",
      priority: "high",
    });
  } else if (/rider|hospital|ward/.test(lower)) {
    suggestions.push({
      type: "plain_language",
      title: "Hospitalisation rider analogy",
      content:
        "A hospitalisation rider is like adding a specialist layer to your base plan — the base policy is the foundation; the rider covers the extra ward or treatment costs you choose. Premium goes up because you're buying more specific protection.",
      priority: "high",
    });
  } else if (/loan|borrow/.test(lower)) {
    suggestions.push({
      type: "compliance",
      title: "Policy loan disclosures",
      content:
        "Remind clients: loans accrue interest, reduce death benefit if unpaid, and may have tax consequences. Document that you explained alternatives (surrender vs loan) and that suitability depends on their full financial picture.",
      priority: "high",
    });
  } else if (/term|whole|compare/.test(lower)) {
    suggestions.push({
      type: "knowledge",
      title: "Term vs whole life (simple)",
      content:
        "Term = pure protection for a set period — like renting coverage. Whole life = lifelong coverage plus cash value — like owning with a savings component. Term is usually lower premium; whole life costs more but builds value. Frame as goals and time horizon, not 'better/worse'.",
      priority: "medium",
    });
  } else if (/checklist|prepare|before meeting/.test(lower)) {
    suggestions.push({
      type: "next_action",
      title: "Pre-consultation checklist",
      content:
        "Review intake brief · Confirm top 2 client concerns · Prepare one analogy · Flag disclosure topics · Have plan comparison ready · Set agenda (30–45 min) · Note follow-up items for wrap-up summary.",
      priority: "medium",
    });
  } else if (contexts.length > 0) {
    const top = contexts[0].article;
    suggestions.push({
      type: "knowledge",
      title: top.title,
      content: top.content.slice(0, 400),
      priority: "medium",
    });
  } else {
    suggestions.push({
      type: "plain_language",
      title: "Desk assistant",
      content:
        "Ask me to explain any term, draft a plain-language script, or surface disclosure reminders. I'm not linked to a customer session — use Live Assist when you're with a specific client.",
      priority: "medium",
    });
  }

  return {
    suggestions,
    retrievedArticles: contexts,
    customerSentiment: "neutral",
    recommendedDisposition: "desk_assist",
  };
}

function mockCopilotResponse(
  messages: ChatMessage[],
  contexts: ReturnType<typeof retrieveContext>
): CopilotResponse {
  const lastUser = getLastUserMessage(messages);
  const sentiment = inferSentiment(messages);

  const suggestions: CopilotSuggestion[] = [
    {
      type: "response_draft",
      title: "Suggested reply",
      content:
        sentiment === "distressed"
          ? "I'm truly sorry you're going through this. Let me make sure we handle this with the care it deserves. May I start by confirming the policy number so I can look up the right information for you?"
          : "Thank you for reaching out. I can definitely help with that. To get started, could I verify your policy number?",
      priority: "high",
    },
  ];

  if (contexts.length > 0) {
    suggestions.push({
      type: "knowledge",
      title: contexts[0].article.title,
      content: contexts[0].article.content.slice(0, 300) + "...",
      priority: "medium",
    });
  }

  if (/loan|withdraw|surrender/.test(lastUser.toLowerCase())) {
    suggestions.push({
      type: "compliance",
      title: "Tax & benefit disclosure",
      content:
        "Remind customer: withdrawals and loans affect policy values and death benefit, and may have tax consequences. Do not provide tax advice — refer to tax professional if asked.",
      priority: "high",
    });
    suggestions.push({
      type: "suitability",
      title: "FR review recommended",
      content:
        "Offer Financial Representative review: 'Would you like me to connect you with your FR to walk through how this fits your overall plan?'",
      priority: "medium",
    });
  }

  if (/suitable|recommend|which policy|right for me|what should i buy/.test(lastUser.toLowerCase())) {
    suggestions.push({
      type: "suitability",
      title: "Suitability discovery prompts",
      content:
        "Do NOT recommend products. Ask: What are your protection goals? Time horizon? Existing coverage? Budget? Life changes ahead? Then offer FR consultation for formal suitability assessment.",
      priority: "high",
    });
    suggestions.push({
      type: "plain_language",
      title: "Set expectations",
      content:
        "Explain to client: 'Product suitability is a personalized assessment your Financial Representative conducts — I can help you understand terms and prepare questions.'",
      priority: "high",
    });
  }

  if (/explain|confused|don't understand|what does|mean|jargon/.test(lastUser.toLowerCase()) && contexts.length > 0) {
    suggestions.push({
      type: "plain_language",
      title: "Simplify for client",
      content: `Use everyday wording from knowledge base: ${contexts[0].article.title}. Avoid acronyms unless defined.`,
      priority: "medium",
    });
  }

  if (/death|claim|deceased/.test(lastUser.toLowerCase())) {
    suggestions.push({
      type: "compliance",
      title: "Death claim sensitivity",
      content:
        "Use empathetic language. Required: certified death certificate. Claims line: 1-800-496-1035. Online filing available. Do not rush the conversation.",
      priority: "high",
    });
    suggestions.push({
      type: "next_action",
      title: "Verify & document",
      content: "Confirm policy number → Check claim status in system → Provide timeline expectations → Offer to stay on line",
      priority: "high",
    });
  }

  suggestions.push({
    type: "summary",
    title: "Conversation snapshot",
    content: `Customer inquiry: "${lastUser.slice(0, 120)}${lastUser.length > 120 ? "..." : ""}". Sentiment: ${sentiment}. ${contexts.length} knowledge articles matched.`,
    priority: "low",
  });

  return {
    suggestions,
    retrievedArticles: contexts,
    customerSentiment: sentiment,
    recommendedDisposition: sentiment === "distressed" ? "Escalation - Sensitive" : "Policy Inquiry - Resolved/Guided",
  };
}

export async function generateCustomerChat(
  messages: ChatMessage[],
  sessionContext?: { policyNumber?: string; productLine?: string; summarySnippet?: string },
  variant: CustomerChatVariant = "general"
): Promise<ChatResponse> {
  const lastQuery = getLastUserMessage(messages);
  const contexts = retrieveContext(lastQuery, 4);
  const escalation = detectEscalationTriggers(lastQuery);

  if (useMockLLM()) {
    return variant === "fr_prep" ? mockFrPrepResponse(lastQuery) : mockCustomerResponse(lastQuery, contexts);
  }

  const client = getOpenAIClient()!;
  const contextBlock = formatContextForPrompt(contexts);
  const basePrompt = variant === "fr_prep" ? FR_PREP_SYSTEM_PROMPT : CUSTOMER_SYSTEM_PROMPT;

  const systemWithContext = `${basePrompt}

${variant === "general" ? `RETRIEVED KNOWLEDGE (use as primary reference):
${contextBlock}` : ""}

${sessionContext?.policyNumber ? `Customer policy number on file: ${sessionContext.policyNumber}` : ""}
${sessionContext?.productLine ? `Product line: ${sessionContext.productLine}` : ""}
${sessionContext?.summarySnippet ? `Prior navigator summary: ${sessionContext.summarySnippet}` : ""}`;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: systemWithContext },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  const message = completion.choices[0]?.message?.content ?? MOCK_CUSTOMER_RESPONSES.default;

  return {
    message,
    sources: contexts,
    suggestedFollowUps: variant === "fr_prep"
      ? [
          "What questions should I ask my rep?",
          "How do I join the video call?",
          "What happens after the consultation?",
        ]
      : [
          "Can you explain that in simpler terms?",
          "What are my next steps?",
          "Connect me with a representative",
        ],
    escalateToHuman: escalation.shouldEscalate,
    escalationReason: escalation.reason,
  };
}

export async function generateCopilotAssist(
  messages: ChatMessage[],
  agentQuery?: string,
  handoff?: import("./navigator/types").FrHandoffDocument,
  variant: CopilotVariant = "session"
): Promise<CopilotResponse> {
  const lastUser = agentQuery ?? getLastUserMessage(messages);
  const searchQuery = lastUser;
  const contexts = retrieveContext(searchQuery, 5);

  if (useMockLLM()) {
    if (variant === "general") {
      return mockGeneralRepResponse(lastUser, contexts);
    }
    const base = mockCopilotResponse(messages.length ? messages : [{ id: "q", role: "user", content: lastUser, timestamp: new Date().toISOString() }], contexts);
    if (handoff?.customerInsight && agentQuery) {
      base.suggestions.unshift({
        type: "suitability",
        title: "Customer context",
        content: `${handoff.customerInsight.riskProfileLabel}. Likely objections: ${handoff.customerInsight.likelyObjections.join("; ")}.`,
        priority: "medium",
      });
    }
    return base;
  }

  const client = getOpenAIClient()!;
  const contextBlock = formatContextForPrompt(contexts);
  const conversationTranscript = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const handoffBlock =
    variant === "session" && handoff
      ? `\nCUSTOMER HANDOFF:\nNeeds: ${handoff.customerSummary.needsIdentified.join(", ")}\nPlans: ${handoff.customerSummary.productsExplored.join(", ")}\nInsight: ${handoff.customerInsight?.riskProfileLabel ?? "N/A"}`
      : "";

  const systemPrompt = variant === "general" ? REP_DESK_SYSTEM_PROMPT : AGENT_COPILOT_SYSTEM_PROMPT;
  const userPrompt =
    variant === "general"
      ? `KNOWLEDGE BASE:\n${contextBlock}\n\nRepresentative request: ${agentQuery ?? "Provide desk assistance"}`
      : `LIVE CONVERSATION:\n${conversationTranscript || "(No live transcript yet)"}\n${handoffBlock}\n\nKNOWLEDGE BASE:\n${contextBlock}\n\nAgent request: ${agentQuery ?? "Provide real-time assistance for this interaction"}`;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 900,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(raw) as CopilotResponse;
    return {
      ...parsed,
      retrievedArticles: contexts,
    };
  } catch {
    return mockCopilotResponse(messages, contexts);
  }
}
