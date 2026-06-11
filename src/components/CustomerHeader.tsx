"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PrudentialLogo } from "./PrudentialLogo";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { label: "Products", href: "/chat" },
  { label: "Claims & Services", href: "/chat" },
];

export function CustomerHeader() {
  const { role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="border-b border-pru-gray-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <PrudentialLogo />

            <span className="hidden sm:inline text-xs bg-pru-red-light text-pru-red px-2 py-1 rounded-full font-medium">
              Customer Portal
            </span>

            <div className="flex items-center gap-3">
              <Link href="/" className="text-xs text-gray-500 hover:text-pru-red hidden sm:inline">
                Switch portal
              </Link>
              {role === "customer" ? (
                <button type="button" onClick={handleLogout} className="btn-login text-xs">
                  Logout
                </button>
              ) : (
                <Link href="/" className="btn-login text-xs sm:text-sm">
                  Login
                </Link>
              )}
              <Link
                href="/chat"
                className={`text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full transition-colors ${
                  pathname === "/chat"
                    ? "bg-pru-red text-white"
                    : "text-pru-red border border-pru-red hover:bg-pru-red-light"
                }`}
              >
                Insurance Navigator
              </Link>
            </div>
          </div>
        </div>
      </div>

      <nav className="bg-pru-red">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-0 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="block whitespace-nowrap px-4 py-3.5 text-sm font-medium text-white hover:bg-pru-red-dark transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
