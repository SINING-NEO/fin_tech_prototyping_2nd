"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { TAB_ROLE_KEY, type UserRole } from "@/lib/auth";

interface AuthState {
  role: UserRole | null;
  authenticated: boolean;
  loading: boolean;
  login: (role: UserRole, password?: string) => Promise<{ ok: boolean; redirect?: string; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function readTabRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(TAB_ROLE_KEY);
  return value === "customer" || value === "agent" ? value : null;
}

function writeTabRole(role: UserRole | null) {
  if (typeof window === "undefined") return;
  if (role) {
    sessionStorage.setItem(TAB_ROLE_KEY, role);
  } else {
    sessionStorage.removeItem(TAB_ROLE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const tabRole = readTabRole();
    if (tabRole) {
      setRole(tabRole);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      const cookieRole = data.role ?? null;
      setRole(cookieRole);
      if (cookieRole) {
        writeTabRole(cookieRole);
      }
    } catch {
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function login(userRole: UserRole, password?: string) {
    if (userRole === "customer") {
      writeTabRole("customer");
      setRole("customer");
      return { ok: true, redirect: "/chat" };
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: userRole, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Login failed" };
    }
    writeTabRole("agent");
    setRole("agent");
    return { ok: true, redirect: data.redirect as string };
  }

  async function logout() {
    const currentRole = readTabRole() ?? role;
    writeTabRole(null);
    setRole(null);

    if (currentRole === "agent") {
      await fetch("/api/auth/logout", { method: "POST" });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        role,
        authenticated: role !== null,
        loading,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
