"use client";

import { useState } from "react";
import { InsuranceNavigator } from "./navigator/InsuranceNavigator";

export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] h-[min(560px,calc(100vh-8rem))] bg-white rounded-2xl shadow-chat flex flex-col overflow-hidden border border-pru-gray-border">
          <div className="bg-pru-red text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="font-semibold text-sm">PRUDENTIAL</p>
              <p className="text-xs text-red-100">Virtual Assistant</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-4 py-2 bg-pru-gray-light border-b border-pru-gray-border flex-shrink-0">
            <p className="text-sm font-semibold text-pru-gray-dark">Need help? Talk to us</p>
            <p className="text-xs text-gray-500">Insurance Navigator — empowers your Financial Representative</p>
          </div>
          <div className="flex-1 min-h-0">
            <InsuranceNavigator compact />
          </div>
        </div>
      )}

      {/* Floating pill trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 flex items-center gap-0 bg-white rounded-full shadow-pill hover:shadow-lg transition-shadow overflow-hidden border border-pru-gray-border"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <span className="pl-5 pr-3 py-3.5 text-sm font-medium text-pru-gray-dark whitespace-nowrap">
          Need help? Talk to us
        </span>
        <span className="w-12 h-12 bg-pru-red flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        </span>
      </button>
    </>
  );
}
