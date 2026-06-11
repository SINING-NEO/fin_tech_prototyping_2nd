# Real-World Research: Insurance AI Copilot & Conversational Chat

This document summarizes industry patterns, vendor solutions, and architectural best practices relevant to the Prudential Insurance chat copilot prototype.

---

## 1. Current State: Prudential Digital Service

### What exists today

Prudential Financial operates **Virtual Chat Assistants** for:

- **Life Insurance** — policy inquiries, transaction status, general support
- **Annuities** — contract and transaction questions

Support channels (from public sources):

| Channel | Details |
|---------|---------|
| Life Insurance phone | 1-800-778-2255 (Mon–Fri 8 AM–8 PM ET) |
| FE-prefix policies | 1-833-626-1865 (Mon–Fri 8 AM–6 PM ET) |
| Death claims | 1-800-496-1035 |
| Online self-service | Policy values, payments, beneficiaries, eDelivery |
| Secure messaging | Async CSR communication post-enrollment |
| Voice biometrics | Faster repeat-call verification |

### Gap this prototype addresses

Current virtual assistants tend toward **FAQ-style Q&A** — customers pick topics or get templated answers. Industry leaders are moving to:

1. **Conversational dialogue** with memory and empathy
2. **Agent assist copilots** that reduce handle time 25–30%
3. **RAG-grounded responses** to reduce hallucination on policy rules
4. **Structured escalation** with context handoff to humans

---

## 2. Industry Vendor Landscape

### Genesys Cloud Agent Copilot

**Source:** [Genesys Copilots](https://www.genesys.com/capabilities/copilots)

- Real-time assistance during live interactions
- Custom scripting and next-best-action suggestions
- Native access to contact center data and tools
- Conversational interface for supervisors and agents
- Applicable beyond contact centers: "loan officers, insurance brokers, patient advocates"

**Relevance:** Model for our `/agent` copilot panel — suggestions appear alongside live chat, not replacing the agent.

### Talkdesk Copilot

**Source:** [Talkdesk Copilot](https://www.talkdesk.com/cloud-contact-center/omnichannel-engagement/copilot/)

- Real-time transcription + smart scripts during calls
- Automated call notes and dispositions
- Multi-agent orchestration across knowledge sources
- KPI impact: FCR, AHT, CSAT, wait time

**Relevance:** Our copilot includes disposition suggestions and wrap-up summaries — direct parallel to Talkdesk's automated notes.

### EXL Smart Agent Assist (Insurance-specific)

**Source:** EXL / LinkedIn industry posts

Reported outcomes for insurance contact centers:

| Metric | Improvement |
|--------|-------------|
| Handle time | ~30% faster |
| First-call resolution | ~15% higher |
| CX scores | ~10% improvement |

Capabilities:

- FNOL, policy servicing, billing, claims guidance
- Compliance alerts in real time
- Voice + chat omnichannel
- Unified intelligence layer

**Relevance:** Our knowledge base explicitly covers FNOL intake and compliance cards — mirrors EXL's insurance-specific copilot.

### AWS Omnichannel Claims (Generative AI)

**Source:** [AWS Guidance - Claims Processing with GenAI](https://github.com/aws-solutions-library-samples/guidance-for-omnichannel-claims-processing-powered-by-generative-ai-on-aws)

Architecture pattern:

```
Customer → Amazon Connect/Lex (chat/voice/SMS)
         → DynamoDB (case storage)
         → S3 (documents)
         → Textract + Bedrock (document/damage analysis)
         → Bedrock Knowledge Base + OpenSearch (adjuster search)
```

**Relevance:** Production path for our prototype — swap mock RAG for Bedrock Knowledge Base, add Connect for telephony.

### Floatbot Claims AI (LISA)

**Source:** [Floatbot FNOL Automation](https://floatbot.ai/automate-insurance-claims-process)

- 24/7 FNOL intake with real-time validation
- Guidewire/Duck Creek integration
- Adjuster workspace with next-best actions
- Compliance checks during intake

---

## 3. Architectural Patterns

### Pattern A: Retrieval-Augmented Generation (RAG)

**Why for insurance:**

- Policy rules change; RAG updates without retraining
- Reduces hallucination on coverage details
- Auditable — cite source articles

**Our implementation:**

```
User query → keyword scoring over knowledge/*.json → top-K articles → LLM prompt
```

**Production upgrade:**

```
Documents → chunk → embed (text-embedding-3-small) → vector DB → semantic search → rerank → LLM
```

References: [Velotio - RAG in Health Insurance](https://www.velotio.com/engineering-blog/policy-insights-chatbots-and-rag-in-health-insurance-navigation), [Insurance RAG Chatbot (GitHub)](https://github.com/arpan65/Insurance-RAG-Chatbot)

### Pattern B: Human-in-the-Loop Orchestration

From Naviant's agentic AI framework:

| Role | Responsibility |
|------|------------------|
| **Bot** | Repetitive retrieval, form pre-fill, status lookup |
| **Agent (AI)** | Multi-step reasoning within guardrails |
| **Human** | Exceptions, empathy, regulatory judgment |

Escalation triggers in our prototype:

- Death claims / bereavement
- Legal language
- Fraud concerns
- Explicit "speak to human" requests
- Crisis-related language

### Pattern C: Dual-Mode Platform

| Customer-facing | Agent-facing |
|-----------------|--------------|
| Warm, simplified language | Technical knowledge + compliance |
| Self-service guidance | Draft responses + next actions |
| Escalation offer | Sentiment + disposition codes |
| No PII collection | Identity verification reminders |

This mirrors **Creatio's** distinction between "AI Agent" (customer) and "Agent Copilot" (human assist).

---

## 4. Insurance-Specific Requirements

### Compliance & regulatory

1. **No tax/legal advice** — disclose and refer
2. **Identity verification** before policy-specific discussion
3. **PII handling** — no SSN/bank details in chat
4. **State variations** — production systems need state-specific rules
5. **NAIC / state DOI** — complaint escalation paths

### Sensitive workflows

| Workflow | AI role | Human role |
|----------|---------|------------|
| Death claim (FNOL) | Empathetic intake, document checklist | Verify relationship, process claim |
| Policy loan | Explain process + disclosures | Confirm amounts in system |
| Lapse/reinstatement | Explain general rules | Underwriting decision |
| Fraud report | Collect initial info | Security team escalation |

### Metrics to track (production)

- Containment rate (resolved without human)
- Escalation rate by topic
- Average handle time (with vs without copilot)
- First contact resolution
- CSAT / NPS
- Compliance flag frequency
- Knowledge article hit rate

---

## 5. Mapping Research → Our Prototype

| Industry capability | Prototype feature | File |
|---------------------|-------------------|------|
| Conversational CX | PruAssist customer chat | `src/components/CustomerChat.tsx` |
| Agent assist | Copilot workspace | `src/components/AgentCopilotWorkspace.tsx` |
| Knowledge retrieval | RAG layer | `src/lib/rag.ts` |
| Compliance alerts | Copilot suggestion type `compliance` | `src/lib/prompts.ts` |
| Escalation | `detectEscalationTriggers()` | `src/lib/rag.ts` |
| FNOL guidance | Claims knowledge articles | `knowledge/claims.json` |
| Mock/demo mode | `USE_MOCK_LLM` | `src/lib/llm.ts` |

---

## 6. Recommended Production Roadmap

### Phase 1 — Pilot (8–12 weeks)
- [ ] Expand knowledge base with internal SOPs
- [ ] Add vector embeddings + semantic search
- [ ] Integrate with CRM (Salesforce) for policy lookup
- [ ] A/B test: copilot on vs off for handle time

### Phase 2 — Scale
- [ ] Amazon Connect / Genesys integration
- [ ] Voice channel with real-time transcription
- [ ] Automated wrap-up notes to CRM
- [ ] Supervisor dashboard for escalation queue

### Phase 3 — Agentic workflows
- [ ] Tool calling: schedule callback, create case, check claim status
- [ ] Multi-agent orchestration (intake agent + compliance agent)
- [ ] Fraud detection signals
- [ ] Continuous learning from agent feedback

---

## 7. References

1. Genesys Cloud Copilots — https://www.genesys.com/capabilities/copilots
2. Talkdesk Copilot — https://www.talkdesk.com/cloud-contact-center/omnichannel-engagement/copilot/
3. AWS Claims GenAI Guidance — https://github.com/aws-solutions-library-samples/guidance-for-omnichannel-claims-processing-powered-by-generative-ai-on-aws
4. Creatio AI Agents Glossary — https://www.creatio.com/glossary/ai-agents-customer-service
5. Prudential FAQ (public) — https://www.prudential.com/links/faq
6. Prudential Contact — https://www.prudential.com/links/contact-us
7. Floatbot FNOL — https://floatbot.ai/automate-insurance-claims-process
8. Velotio RAG in Insurance — https://www.velotio.com/engineering-blog/policy-insights-chatbots-and-rag-in-health-insurance-navigation

---

*Last updated: June 2025 — for Poly-Fintech prototyping project*
