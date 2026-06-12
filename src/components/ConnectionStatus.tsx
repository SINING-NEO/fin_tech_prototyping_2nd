"use client";

import { useEffect, useState } from "react";

interface ConnectionStatusProps {
  role: "customer" | "agent";
  sessionId?: string;
}

export function ConnectionStatus({ role, sessionId }: ConnectionStatusProps) {
  const [queueCount, setQueueCount] = useState<number | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [storeMode, setStoreMode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function poll() {
      try {
        if (role === "agent") {
          const res = await fetch("/api/sessions", { credentials: "same-origin" });
          const data = await res.json();
          if (res.ok) {
            setQueueCount((data.sessions ?? []).length);
            setStoreMode(data.storeMode ?? null);
            setError(null);
            setConnected(true);
          } else {
            setConnected(false);
            setError(data.error ?? `Queue unavailable (${res.status})`);
            setStoreMode(data.storeMode ?? null);
          }
        } else if (sessionId) {
          const res = await fetch(`/api/sessions/${sessionId}`);
          const data = await res.json();
          if (res.ok) {
            setSessionStatus(data.session?.status ?? null);
            setStoreMode(data.storeMode ?? null);
            setError(null);
            setConnected(true);
          } else {
            setConnected(false);
            setError(data.error ?? `Session unavailable (${res.status})`);
            setStoreMode(data.storeMode ?? null);
          }
        } else {
          setConnected(true);
          setError(null);
        }
      } catch {
        setConnected(false);
        setError("Cannot reach server");
      }
    }
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [role, sessionId]);

  const storeLabel =
    storeMode === "redis" ? "Shared cloud store" : storeMode === "file" ? "Local dev store" : null;

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${
          connected
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
        {role === "agent" ? (
          <span>
            {connected
              ? `${storeLabel ?? "Connected"} · ${queueCount ?? 0} customer(s) in queue`
              : "Not connected"}
          </span>
        ) : sessionStatus === "live_with_agent" ? (
          <span>Connected to Financial Representative</span>
        ) : sessionStatus === "waiting_for_agent" ? (
          <span>Waiting for representative…</span>
        ) : (
          <span>{connected ? `${storeLabel ?? "Connected"} — ready to sync` : "Not connected"}</span>
        )}
      </div>
      {error && <p className="text-[10px] text-red-600 leading-snug px-1">{error}</p>}
    </div>
  );
}
