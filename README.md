# Prudential Insurance Navigator — Prototype

A full-stack prototype for **PruAssist**, the Prudential Insurance Navigator: conversational AI that **empowers Financial Representatives** — not replaces them — by simplifying policy language, supporting suitability conversations, and building customer confidence in the advisory process.

> **Disclaimer:** Academic/prototyping project. Not affiliated with Prudential Financial. Not connected to production systems.

## Design principles

See [`docs/DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md) for the full framework. In short:

- **Empower FRs, don't replace them** — AI navigates and explains; advisors decide
- **Plain language** — translate policy jargon for customers and representatives
- **Suitability support** — discovery prompts and FR handoff, never product recommendations
- **Advisory confidence** — help customers feel prepared for human guidance

## Customer journey (Insurance Navigator)

| Step | What happens |
|------|----------------|
| 1. Intent | Insurance · Investments · Rewards · Priority programmes |
| 2. Insurance type | Health · Life · Accident · Critical illness |
| 3. Profiling | Age, family, budget, English, familiarity → adapts explanations |
| 4. Match | Interprets concern (e.g. hospital bills → medical protection) |
| 5. Compare | Products with covers, good-for, limitations, premium range |
| 6. Confidence | 😟 Still confused · 😐 Somewhat · 😊 Understand well |
| 7. Decision | Trade-offs + FR connection or save for ~6 months |
| 8. Summary | Downloadable handoff document for customer & FR |

See [`docs/PITCH.md`](docs/PITCH.md) for the 1-minute elevator pitch.

## Two portals

| Portal | Login | Routes | Access |
|--------|-------|--------|--------|
| **Customer** | `/login` → Continue as Customer | `/`, `/chat` | Insurance Navigator + AI chat |
| **Agent (FR)** | `/login?portal=agent` + password | `/agent` | Copilot workspace (protected) |

**Demo agent password:** `prudential2025` (set `AGENT_DEMO_PASSWORD` in `.env.local`)

## What's included

| Mode | Route | Purpose |
|------|-------|---------|
| **Insurance Navigator (PruAssist)** | `/chat` | Plain-language guide for customers; routes suitability to FR |
| **Financial Representative Copilot** | `/agent` | Agent-only — handoffs, drafts, compliance |
| **Landing** | `/` | Overview and architecture |

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

**Option A — Demo without API key (default):**
```env
USE_MOCK_LLM=true
```

**Option B — Full AI with OpenAI:**
```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
USE_MOCK_LLM=false
```

### 3. Run development server

```bash
npm run dev
```

The dev script **automatically picks a free port** starting at 3000. If 3000 is busy, it uses 3001, 3002, etc. Check the terminal for the exact URL (e.g. `http://localhost:3001`).

To prefer a specific port:

```bash
PORT=4000 npm run dev
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Customer Chat  │     │  Agent Copilot  │
│    /chat        │     │    /agent       │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
    /api/chat              /api/copilot
         │                       │
         └───────────┬───────────┘
                     ▼
           RAG Retrieval (keyword + semantic scoring)
                     │
                     ▼
         knowledge/*.json (25+ Prudential articles)
                     │
                     ▼
              OpenAI GPT-4o-mini
              (or mock fallback)
```

### Key design decisions

1. **RAG over fine-tuning** — Knowledge base from public Prudential FAQ content; easy to update without retraining
2. **Human-in-the-loop** — Copilot suggests; agents decide. Auto-escalation for sensitive topics
3. **Compliance by design** — Tax/loan/disclosure triggers, PII warnings, death claim protocols
4. **Mock mode** — Works offline for demos and grading without API costs

## Knowledge base

Articles in `knowledge/` cover:

- Life insurance (values, payments, loans, beneficiaries)
- Claims & FNOL (death claims, status checks)
- Annuities & policy servicing
- Online account access
- Compliance & regulatory guardrails

Each article includes `agentNotes` for copilot context.

## Real-world research

See [`docs/RESEARCH.md`](docs/RESEARCH.md) for deep analysis of:

- Genesys Agent Copilot, Talkdesk Copilot, EXL Smart Agent Assist
- AWS omnichannel claims + Bedrock patterns
- Insurance RAG chatbot architectures
- Current Prudential virtual chat landscape

## Extending the prototype

| Next step | How |
|-----------|-----|
| Vector embeddings | Add OpenAI embeddings + ChromaDB/Pinecone |
| Voice channel | Integrate Amazon Connect / Twilio |
| CRM integration | Connect to Salesforce Service Cloud |
| Auth & policy lookup | Mock API → Guidewire/Duck Creek |
| Analytics | Log conversations, FCR, escalation rates |

## Tech stack

- **Next.js 15** (App Router, API routes)
- **TypeScript** + **Tailwind CSS**
- **OpenAI API** (optional)
- **Custom RAG** (keyword scoring; upgrade path to embeddings)

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

## License

Prototype for educational use only.
