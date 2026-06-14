"use client";

import { FR_INFO_LINKS, FR_VIDEO_LINKS, type FrResourceLink } from "@/lib/navigator/fr-resources";

interface CustomerFrResourcesPanelProps {
  compact?: boolean;
  showVideo?: boolean;
  showInfo?: boolean;
  sessionId?: string;
}

function ResourceLink({ link, compact }: { link: FrResourceLink; compact?: boolean }) {
  const isTel = link.href.startsWith("tel:");
  return (
    <a
      href={link.href}
      target={link.external ? "_blank" : undefined}
      rel={link.external ? "noopener noreferrer" : undefined}
      className={`flex gap-3 rounded-xl border border-pru-gray-border bg-white hover:border-pru-red hover:shadow-sm transition-colors ${
        compact ? "p-2.5" : "p-3"
      }`}
    >
      {link.icon && <span className="text-lg flex-shrink-0 leading-none">{link.icon}</span>}
      <div className="min-w-0">
        <p className={`font-medium text-pru-gray-dark ${compact ? "text-xs" : "text-sm"}`}>{link.label}</p>
        <p className={`text-gray-500 mt-0.5 ${compact ? "text-[10px] leading-snug" : "text-xs leading-relaxed"}`}>
          {link.description}
        </p>
        {isTel && (
          <p className="text-[10px] text-pru-red font-mono mt-1">{link.href.replace("tel:", "")}</p>
        )}
      </div>
      {link.external && <span className="text-gray-400 text-xs flex-shrink-0 self-center">↗</span>}
    </a>
  );
}

export function CustomerFrResourcesPanel({
  compact = false,
  showVideo = true,
  showInfo = true,
  sessionId,
}: CustomerFrResourcesPanelProps) {
  return (
    <div className={`space-y-4 ${compact ? "text-xs" : "text-sm"}`}>
      {showVideo && (
        <section>
          <h4 className={`font-semibold text-pru-gray-dark flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
            <span>🎥</span> Video call with your rep
          </h4>
          <p className={`text-gray-500 mt-1 ${compact ? "text-[10px]" : "text-xs"}`}>
            When your Financial Representative is ready, join via video. Demo links below — your rep may send a personalised invite.
          </p>
          <div className={`mt-2 grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
            {FR_VIDEO_LINKS.map((link) => (
              <ResourceLink key={link.id} link={link} compact={compact} />
            ))}
          </div>
        </section>
      )}

      {showInfo && (
      <section>
        <h4 className={`font-semibold text-pru-gray-dark flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
          <span>📚</span> Helpful resources
        </h4>
        <div className="mt-2 grid gap-2">
          {FR_INFO_LINKS.map((link) => (
            <ResourceLink key={link.id} link={link} compact={compact} />
          ))}
        </div>
      </section>
      )}

      {sessionId && (
        <p className={`text-gray-400 font-mono ${compact ? "text-[10px]" : "text-xs"}`}>
          Session ID for your rep: {sessionId.slice(0, 8)}…
        </p>
      )}

      <p className={`text-gray-400 italic ${compact ? "text-[10px]" : "text-xs"}`}>
        Prototype links — not connected to real Prudential scheduling systems.
      </p>
    </div>
  );
}
