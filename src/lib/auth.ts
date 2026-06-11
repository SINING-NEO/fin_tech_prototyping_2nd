export type UserRole = "customer" | "agent";

export const ROLE_COOKIE = "pru_role";
export const AUTH_COOKIE = "pru_auth";
export const TAB_ROLE_KEY = "pru_tab_role";

export function getAgentDemoPassword(): string {
  return process.env.AGENT_DEMO_PASSWORD ?? "prudential2025";
}

export function isValidRole(value: string | undefined): value is UserRole {
  return value === "customer" || value === "agent";
}
