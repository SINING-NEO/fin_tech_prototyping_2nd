import type { KnowledgeArticle } from "./types";
import lifeInsurance from "../../knowledge/life-insurance.json";
import annuities from "../../knowledge/annuities.json";
import claims from "../../knowledge/claims.json";
import policyServicing from "../../knowledge/policy-servicing.json";
import onlineAccess from "../../knowledge/online-access.json";
import compliance from "../../knowledge/compliance.json";
import suitability from "../../knowledge/suitability.json";

export const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  ...(lifeInsurance as KnowledgeArticle[]),
  ...(annuities as KnowledgeArticle[]),
  ...(claims as KnowledgeArticle[]),
  ...(policyServicing as KnowledgeArticle[]),
  ...(onlineAccess as KnowledgeArticle[]),
  ...(compliance as KnowledgeArticle[]),
  ...(suitability as KnowledgeArticle[]),
];

export const CATEGORY_LABELS: Record<string, string> = {
  "life-insurance": "Life Insurance",
  annuities: "Annuities",
  claims: "Claims & FNOL",
  "policy-servicing": "Policy Servicing",
  "online-access": "Online Account",
  compliance: "Compliance & Disclosures",
  suitability: "Suitability & Advisory",
};
