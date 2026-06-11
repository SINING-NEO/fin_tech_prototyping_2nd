"use client";

import { useEffect, useState } from "react";

interface ConnectionStatusProps {
  role: "customer" | "agent";
  sessionId?: string;
}

export function ConnectionStatus({ role, sessionId }: ConnectionStatusProps) {
  const [queueCount, setQueueCount] = useState<number | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function poll() {
      try {
        if (role === "agent") {
          const res = await fetch("/api/sessions");
          if (res.ok) {
            const data = await res.json();
            const sessions = data.sessions ?? [];
            setQueueCount(sessions.length);
            setConnected(true);
          }
        } else if (sessionId) {
          const res = await fetch(`/api/sessions/${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            setSessionStatus(data.session?.status ?? null);
            setConnected(true);
          }
        } else {
          setConnected(true);
        }
      } catch {
        setConnected(false);
      }
    }
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [role, sessionId]);

  return (
    <div
      className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${
        connected ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
      {role === "agent" ? (
        <span>Local server · {queueCount ?? "…"} customer(s) in queue</span>
      ) : sessionStatus === "live_with_agent" ? (
        <span>Connected to Financial Representative</span>
      ) : sessionStatus === "waiting_for_agent" ? (
        <span>Waiting for representative…</span>
      ) : (
        <span>Local server connected</span>
      )}
    </div>
  );
}
