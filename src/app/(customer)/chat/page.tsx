"use client";

import { InsuranceNavigator } from "@/components/navigator/InsuranceNavigator";
import { ConnectionStatus } from "@/components/ConnectionStatus";

export default function ChatPage() {
  return (
    <div className="bg-pru-gray-light min-h-[calc(100vh-7rem)] py-6 px-4">
      <div className="max-w-2xl mx-auto mb-3 flex justify-center">
        <ConnectionStatus role="customer" />
      </div>
      <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-chat border border-pru-gray-border overflow-hidden flex flex-col">
        <div className="px-5 py-4 bg-pru-red text-white flex-shrink-0">
          <h1 className="font-semibold text-lg">Need help? Talk to us</h1>
          <p className="text-xs text-red-100 mt-0.5">
            Customer portal — connected locally to agent workspace
          </p>
        </div>
        <div className="flex-1 min-h-0">
          <InsuranceNavigator />
        </div>
      </div>
    </div>
  );
}
