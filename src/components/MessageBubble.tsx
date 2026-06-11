"use client";

import type { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
  compact?: boolean;
}

export function MessageBubble({ message, compact = false }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const avatarSize = compact ? "w-7 h-7" : "w-8 h-8";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div
          className={`${avatarSize} rounded-full bg-pru-red flex items-center justify-center mr-2 flex-shrink-0 mt-1`}
        >
          <span className="text-white text-[10px] font-bold">PA</span>
        </div>
      )}
      <div>
        <div className={isUser ? "chat-bubble-user" : "chat-bubble-assistant"}>
          <p className={`leading-relaxed whitespace-pre-wrap ${compact ? "text-xs" : "text-sm"}`}>
            {message.content}
          </p>
        </div>
        {!compact && (
          <p className="text-xs text-gray-400 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator({ compact = false }: { compact?: boolean }) {
  const avatarSize = compact ? "w-7 h-7" : "w-8 h-8";

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`${avatarSize} rounded-full bg-pru-red flex items-center justify-center`}>
        <span className="text-white text-[10px] font-bold">PA</span>
      </div>
      <div className="chat-bubble-assistant flex gap-1 py-3">
        <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
        <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
        <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
      </div>
    </div>
  );
}
