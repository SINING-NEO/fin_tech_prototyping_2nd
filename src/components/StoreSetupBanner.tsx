"use client";

interface StoreSetupBannerProps {
  message: string;
  compact?: boolean;
}

export function StoreSetupBanner({ message, compact = false }: StoreSetupBannerProps) {
  const isRedisSetup = /redis|upstash/i.test(message);

  if (!isRedisSetup) {
    return (
      <div className={`rounded-xl border border-red-200 bg-red-50 text-red-800 ${compact ? "p-3 text-xs" : "p-4 text-sm"}`}>
        {message}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-amber-200 bg-amber-50 text-amber-950 ${compact ? "p-3" : "p-4 sm:p-5"}`}>
      <p className={`font-semibold ${compact ? "text-xs" : "text-sm"}`}>Live sync needs Redis on Vercel</p>
      <p className={`mt-1 text-amber-900/90 ${compact ? "text-[11px] leading-relaxed" : "text-xs sm:text-sm leading-relaxed"}`}>
        Customer and agent tabs cannot share sessions until a shared store is configured.
      </p>
      <ol className={`mt-3 space-y-1.5 list-decimal ml-4 ${compact ? "text-[11px]" : "text-xs sm:text-sm"}`}>
        <li>
          Open{" "}
          <a
            href="https://vercel.com/integrations/upstash"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-pru-red underline"
          >
            Upstash Redis on Vercel
          </a>{" "}
          and create a free database
        </li>
        <li>
          Add env vars in Vercel → Settings → Environment Variables:
          <code className="block mt-1 bg-white/80 border border-amber-200 rounded px-2 py-1 font-mono text-[10px] sm:text-xs break-all">
            UPSTASH_REDIS_REST_URL
            <br />
            UPSTASH_REDIS_REST_TOKEN
          </code>
        </li>
        <li>Redeploy the project</li>
      </ol>
      <p className={`mt-3 text-amber-800/80 ${compact ? "text-[10px]" : "text-[11px]"}`}>
        Local dev works without Redis. Optional demo fallback: set{" "}
        <code className="font-mono bg-white/80 px-1 rounded">DEMO_MODE_NO_REDIS=true</code> on Vercel
        (single-instance only, not reliable for production).
      </p>
    </div>
  );
}
