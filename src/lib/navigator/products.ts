import type { InsuranceProduct } from "./types";

export const PRODUCTS: InsuranceProduct[] = [
  {
    id: "health-shield",
    name: "PRUShield Health",
    type: "Health",
    covers: ["Hospital bills", "Surgical costs", "Pre/post hospitalisation"],
    goodFor: "Families worried about medical expenses and hospitalisation",
    limitations: "Waiting periods apply; pre-existing conditions may affect coverage",
    keywords: ["hospital", "medical", "health", "bills", "surgery", "ward"],
    premiumBase: 120,
  },
  {
    id: "health-plus",
    name: "PRUHealth Plus",
    type: "Health",
    covers: ["Integrated shield plan", "Specialist visits", "Cancer treatment"],
    goodFor: "Those wanting broader medical protection with specialist access",
    limitations: "Higher premium tier; co-payment may apply on some riders",
    keywords: ["specialist", "cancer", "integrated", "medical"],
    premiumBase: 180,
  },
  {
    id: "life-term",
    name: "PRUTerm Life",
    type: "Life",
    covers: ["Death benefit", "Terminal illness", "Total permanent disability"],
    goodFor: "Income earners protecting dependents on a budget",
    limitations: "No cash value; coverage ends at term expiry unless renewed",
    keywords: ["death", "family", "income", "dependents", "protection", "life"],
    premiumBase: 85,
  },
  {
    id: "life-whole",
    name: "PRUWhole Life",
    type: "Life",
    covers: ["Lifetime protection", "Cash value growth", "Death benefit"],
    goodFor: "Long-term planners wanting protection plus savings component",
    limitations: "Higher premiums than term; early surrender may have charges",
    keywords: ["lifetime", "savings", "cash value", "legacy", "whole life"],
    premiumBase: 220,
  },
  {
    id: "accident-guard",
    name: "PRUAccident Guard",
    type: "Accident",
    covers: ["Accidental death", "Medical reimbursement", "Disability income"],
    goodFor: "Active individuals or occupations with higher accident exposure",
    limitations: "Covers accidents only — not illness-related claims",
    keywords: ["accident", "injury", "disability", "active", "sports"],
    premiumBase: 45,
  },
  {
    id: "ci-cover",
    name: "PRUCritical Cover",
    type: "Critical illness",
    covers: ["37+ critical illnesses", "Lump-sum payout", "Early-stage CI"],
    goodFor: "Those seeking financial buffer during serious illness recovery",
    limitations: "Definitions of covered illnesses apply; survival period may apply",
    keywords: ["critical illness", "cancer", "stroke", "heart", "serious illness"],
    premiumBase: 150,
  },
  {
    id: "ci-multi",
    name: "PRUMulti Crisis Cover",
    type: "Critical illness",
    covers: ["Multiple CI claims", "Relapse benefit", "Reset benefit"],
    goodFor: "Customers wanting comprehensive critical illness protection",
    limitations: "Premium increases with age band; exclusions vary by plan",
    keywords: ["critical", "relapse", "multiple", "illness", "recovery"],
    premiumBase: 210,
  },
];

export const TOP_INTENTS = [
  "Insurance",
  "Investments",
  "Rewards",
  "Priority programmes",
] as const;

export const INSURANCE_TYPES = [
  "Health",
  "Life",
  "Accident",
  "Critical illness",
] as const;

export const PROFILING_OPTIONS = {
  ageRange: ["18-25", "26-35", "36-45", "46-55", "56+"],
  familySituation: [
    "Single",
    "Married, no children",
    "Married with children",
    "Supporting parents",
  ],
  budgetPreference: ["Budget-conscious", "Balanced", "Premium coverage"],
  englishProficiency: ["Basic", "Intermediate", "Fluent"],
  insuranceFamiliarity: ["New to insurance", "Some experience", "Very familiar"],
} as const;

export const CONCERN_STARTERS = [
  "I'm worried about hospital bills",
  "I want to protect my family if something happens to me",
  "I need coverage for accidents",
  "I'm concerned about critical illness costs",
];
