# 1-Minute Pitch — PruAssist Insurance Navigator

## Script (≈60 seconds)

> **Hi, I'm [Name] from [Team].**
>
> Buying insurance is confusing. Customers don't understand policy language, and Financial Representatives spend most of their time **collecting basic information** — not giving advice.
>
> We built **PruAssist**, an agentic AI **Insurance Navigator** that helps people understand and compare coverage. It asks thoughtful questions, profiles the customer, matches Prudential plans, and explains them in **plain language** — with a **confidence meter** before any next step.
>
> When they're ready, we generate a **summary handoff** — needs, products explored, premium range, and open questions — sent to their assigned **Financial Representative**. If they don't need help yet, we save it for future outreach.
>
> On the rep side, our **AI Copilot** provides drafts, compliance alerts, and suitability prompts — so reps **advise**, not administer.
>
> **Result:** instead of 30 minutes gathering facts, reps spend 30 minutes on real advice.  
> **We empower advisors — we don't replace them.**

---

## Problem statement alignment

| Requirement | How we address it |
|-------------|-------------------|
| Simplify policy language | Plain-language product cards (Covers / Good for / Limitations) |
| Thoughtful questions | Profiling + adaptive questioning by budget, family, familiarity |
| Understand & compare coverage | Intent → match → compare → premium ranges |
| Support FR in suitable recommendations | Handoff PDF + copilot; FR confirms suitability |
| Build customer confidence | Confidence meter (😟 😐 😊) before decision |
| Empower FRs, not replace | Navigator prepares; FR decides |

---

## Demo flow (30 sec version)

1. Open `/chat` → select **Insurance** → **Health**
2. Complete profiling → *"I'm worried about hospital bills"*
3. Review matched plans with premiums
4. Confidence meter → **Download summary** → **Keep chatting with PruAssist**
5. (Separately) Financial Representative opens `/agent` → sees **Customer Handoff Summary**

---

## Closing lines

- *"30 minutes of intake → 30 minutes of advice."*
- *"Navigate complexity. Empower the advisor."*
