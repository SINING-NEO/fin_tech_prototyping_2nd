"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PrudentialLogo } from "@/components/PrudentialLogo";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const portal = searchParams.get("portal");
  const redirect = searchParams.get("redirect") ?? (portal === "agent" ? "/agent" : "/chat");

  const [agentPassword, setAgentPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"customer" | "agent">(
    portal === "agent" ? "agent" : "customer"
  );

  async function handleCustomerLogin() {
    setLoading(true);
    setError("");
    const result = await login("customer");
    setLoading(false);
    if (result.ok) {
      router.push(result.redirect ?? "/chat");
      router.refresh();
    } else {
      setError(result.error ?? "Could not continue as customer");
    }
  }

  async function handleAgentLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await login("agent", agentPassword);
    setLoading(false);
    if (result.ok) {
      router.push(redirect.startsWith("/agent") ? redirect : "/agent");
      router.refresh();
    } else {
      setError(result.error ?? "Invalid credentials");
    }
  }

  return (
    <div className="min-h-screen bg-pru-gray-light flex flex-col">
      <div className="bg-white border-b border-pru-gray-border py-6">
        <div className="max-w-md mx-auto px-4 flex justify-center">
          <PrudentialLogo />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-pru-gray-border overflow-hidden">
          <div className="flex border-b border-pru-gray-border">
            <button
              type="button"
              onClick={() => { setActiveTab("customer"); setError(""); }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === "customer"
                  ? "bg-pru-red text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("agent"); setError(""); }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === "agent"
                  ? "bg-pru-gray-dark text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Financial Representative
            </button>
          </div>

          <div className="p-8">
            {activeTab === "customer" ? (
              <div>
                <h1 className="text-xl font-bold text-pru-gray-dark">Customer Portal</h1>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Chat with PruAssist, explore insurance options in plain language, and get
                  help preparing for your Financial Representative.
                </p>
                <ul className="mt-4 text-xs text-gray-500 space-y-1">
                  <li>✓ Insurance Navigator journey</li>
                  <li>✓ AI chat after your summary</li>
                  <li>✓ Request connection to your representative</li>
                </ul>
                <button
                  type="button"
                  onClick={handleCustomerLogin}
                  disabled={loading}
                  className="btn-primary w-full mt-6 disabled:opacity-50"
                >
                  {loading ? "Please wait…" : "Continue as Customer →"}
                </button>
                <Link href="/" className="block text-center text-sm text-gray-500 mt-4 hover:text-pru-red">
                  Back to homepage
                </Link>
              </div>
            ) : (
              <form onSubmit={handleAgentLogin}>
                <h1 className="text-xl font-bold text-pru-gray-dark">Agent Copilot Portal</h1>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Access the Financial Representative workspace — customer handoffs, AI
                  copilot drafts, compliance, and suitability support.
                </p>
                <label className="block mt-6 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Agent password
                </label>
                <input
                  type="password"
                  value={agentPassword}
                  onChange={(e) => setAgentPassword(e.target.value)}
                  placeholder="Enter demo agent password"
                  className="mt-1 w-full border border-pru-gray-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pru-red"
                  required
                />
                <p className="mt-2 text-xs text-gray-400">
                  Demo password: <code className="bg-gray-100 px-1 rounded">prudential2025</code>
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-pru-gray-dark hover:bg-black text-white font-medium py-2.5 rounded-full transition-colors disabled:opacity-50"
                >
                  {loading ? "Signing in…" : "Login as Agent →"}
                </button>
              </form>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pru-gray-light" />}>
      <LoginForm />
    </Suspense>
  );
}
