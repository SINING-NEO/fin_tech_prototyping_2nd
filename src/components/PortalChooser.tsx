"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function PortalChooser() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState<"customer" | "agent" | null>(null);
  const [agentPassword, setAgentPassword] = useState("");
  const [error, setError] = useState("");
  const [showAgentForm, setShowAgentForm] = useState(false);

  async function enterAsCustomer() {
    setLoading("customer");
    setError("");
    const result = await login("customer");
    setLoading(null);
    if (result.ok) {
      router.push("/chat");
      router.refresh();
    } else {
      setError(result.error ?? "Failed to enter customer portal");
    }
  }

  async function enterAsAgent(e: React.FormEvent) {
    e.preventDefault();
    setLoading("agent");
    setError("");
    const result = await login("agent", agentPassword);
    setLoading(null);
    if (result.ok) {
      router.push("/agent");
      router.refresh();
    } else {
      setError("Invalid agent password. Demo: prudential2025");
    }
  }

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {/* Customer portal */}
      <div className="bg-white rounded-2xl border-2 border-pru-red shadow-lg overflow-hidden flex flex-col">
        <div className="bg-pru-red text-white px-6 py-4">
          <span className="text-xs uppercase tracking-wide opacity-90">Portal 1</span>
          <h2 className="text-xl font-bold mt-1">Customer</h2>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <p className="text-sm text-gray-600 leading-relaxed">
            Insurance Navigator, policy comparison, PruAssist AI chat, and live
            connection to your Financial Representative.
          </p>
          <ul className="mt-4 text-xs text-gray-500 space-y-1.5 flex-1">
            <li>✓ Guided insurance journey</li>
            <li>✓ Summary &amp; confidence meter</li>
            <li>✓ Chat with AI or live agent</li>
          </ul>
          <button
            type="button"
            onClick={enterAsCustomer}
            disabled={loading !== null}
            className="btn-primary w-full mt-6 disabled:opacity-50"
          >
            {loading === "customer" ? "Entering…" : "Enter Customer Portal →"}
          </button>
        </div>
      </div>

      {/* Agent portal */}
      <div className="bg-white rounded-2xl border-2 border-pru-gray-dark shadow-lg overflow-hidden flex flex-col">
        <div className="bg-pru-gray-dark text-white px-6 py-4">
          <span className="text-xs uppercase tracking-wide opacity-90">Portal 2</span>
          <h2 className="text-xl font-bold mt-1">Financial Representative</h2>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          {!showAgentForm ? (
            <>
              <p className="text-sm text-gray-600 leading-relaxed">
                Agent Copilot workspace — customer queue, live chat, handoff summaries,
                and AI-assisted replies.
              </p>
              <ul className="mt-4 text-xs text-gray-500 space-y-1.5 flex-1">
                <li>✓ Multiple customer queue</li>
                <li>✓ Live chat with customers</li>
                <li>✓ Copilot drafts &amp; compliance</li>
              </ul>
              <button
                type="button"
                onClick={() => setShowAgentForm(true)}
                className="w-full mt-6 bg-pru-gray-dark hover:bg-black text-white font-medium py-2.5 rounded-full transition-colors"
              >
                Enter Agent Portal →
              </button>
            </>
          ) : (
            <form onSubmit={enterAsAgent} className="flex-1 flex flex-col">
              <p className="text-sm text-gray-600">Enter agent password to access copilot.</p>
              <input
                type="password"
                value={agentPassword}
                onChange={(e) => setAgentPassword(e.target.value)}
                placeholder="Agent password"
                className="mt-4 w-full border border-pru-gray-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-pru-red focus:outline-none"
                autoFocus
                required
              />
              <p className="mt-2 text-xs text-gray-400">Demo: prudential2025</p>
              <button
                type="submit"
                disabled={loading !== null}
                className="w-full mt-4 bg-pru-gray-dark hover:bg-black text-white font-medium py-2.5 rounded-full disabled:opacity-50"
              >
                {loading === "agent" ? "Signing in…" : "Login & Enter →"}
              </button>
              <button
                type="button"
                onClick={() => setShowAgentForm(false)}
                className="mt-2 text-xs text-gray-500 hover:text-pru-red"
              >
                ← Back
              </button>
            </form>
          )}
        </div>
      </div>

      {error && (
        <p className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
