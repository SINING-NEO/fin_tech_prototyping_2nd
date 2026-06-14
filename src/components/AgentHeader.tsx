"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrudentialLogo } from "./PrudentialLogo";
import { ConnectionStatus } from "./ConnectionStatus";
import { useAuth } from "@/context/AuthContext";

export function AgentHeader() {
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-pru-gray-dark text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 min-h-14 py-2 sm:py-0 sm:h-14">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <PrudentialLogo variant="white" />
            <span className="hidden sm:inline text-xs bg-white/10 px-3 py-1 rounded-full whitespace-nowrap">
              Agent Portal
            </span>
          </div>

          <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-xs sm:mx-4">
            <ConnectionStatus role="agent" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href="/" className="text-xs text-gray-300 hover:text-white hidden sm:inline">
              Switch portal
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs border border-white/30 px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
