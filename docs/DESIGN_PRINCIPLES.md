# Insurance Navigator — Design Principles

> **As you develop your solution, bear in mind that the Insurance Navigator is designed to empower Financial Representatives — not replace them.** Your solution should help simplify complex policy language, support suitability conversations, and ultimately build greater customer confidence in the financial advisory process.

---

## The four pillars

### 1. Empower, don't replace

| Navigator does | Financial Representative does |
|----------------|------------------------------|
| Explains policy concepts | Conducts suitability assessment |
| Prepares customer questions | Recommends appropriate products |
| Routes complex decisions | Builds long-term client relationship |
| Drafts plain-language summaries | Makes final advisory judgment |

The AI is a **navigator** — it helps people find their way to informed conversations with their advisor.

### 2. Simplify complex policy language

Insurance documents use terms customers don't understand: death benefit, cash value, surrender charge, rider, premium mode.

The Navigator:
- Translates jargon into everyday language
- Uses analogies where helpful
- Confirms understanding before moving on
- Gives FRs **plain-language drafts** they can use with clients

### 3. Support suitability conversations

The Navigator **never** says "this product is right for you."

Instead it:
- Surfaces **discovery questions** (goals, horizon, coverage, budget)
- Reminds FRs of **disclosure requirements**
- Offers to **connect customer with their FR**
- Escalates suitability questions automatically

### 4. Build customer confidence

Confidence comes from feeling **informed**, not **sold to**.

- Encourage customers to bring questions to their FR
- Be transparent about AI limits
- Help customers prepare for advisory meetings
- Reduce fear of "not understanding" policy documents

---

## How this is implemented in the prototype

| Feature | File | Behavior |
|---------|------|----------|
| Customer system prompt | `src/lib/prompts.ts` | FR empowerment, no product recommendations |
| Agent copilot prompt | `src/lib/prompts.ts` | `plain_language` + `suitability` suggestion types |
| Suitability knowledge | `knowledge/suitability.json` | FR handoff, plain-language glossaries |
| Escalation rules | `src/lib/rag.ts` | Suitability questions → FR connection |
| Mock responses | `src/lib/llm.ts` | Routes "what should I buy" to FR messaging |
| Welcome message | `src/components/CustomerChat.tsx` | Sets Navigator expectations upfront |

---

## Conversation boundaries

**In scope for Navigator:**
- "What does cash value mean?"
- "How do I pay my premium?"
- "What questions should I ask my advisor?"
- "Help me prepare for my policy review"

**Out of scope — route to FR:**
- "Which life insurance is best for me?"
- "Should I surrender my policy?"
- "How much coverage do I need?"
- "Is this investment suitable for retirement?"

---

## Presentation talking points

When demoing to evaluators:

1. **Problem:** Customers don't understand policy language → low confidence → weak advisory conversations
2. **Solution:** Navigator explains + prepares; FR advises + decides
3. **Differentiator:** Not a replacement chatbot — an **advisory confidence layer**
4. **Safety:** Suitability escalation, compliance disclosures, human handoff
5. **Outcome:** Faster informed customers, better FR conversations, higher trust

---

*Poly-Fintech prototyping project*
