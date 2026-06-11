import Link from "next/link";
import { PrudentialLogo } from "./PrudentialLogo";

const NAV_ITEMS = [
  { label: "We Do", href: "/" },
  { label: "Products", href: "/chat" },
  { label: "Claims & Services", href: "/chat" },
  { label: "Priority Programmes", href: "/" },
  { label: "Work With Us", href: "/" },
  { label: "About Us", href: "/" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Utility bar */}
      <div className="border-b border-pru-gray-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <PrudentialLogo />

            <div className="hidden md:flex items-center gap-5 text-sm text-pru-gray-dark">
              <button type="button" className="flex items-center gap-1.5 hover:text-pru-red transition-colors">
                <SearchIcon />
                <span className="sr-only sm:not-sr-only">Search</span>
              </button>
              <Link href="/chat" className="flex items-center gap-1.5 hover:text-pru-red transition-colors">
                <ChatIcon />
                <span>Chat</span>
              </Link>
              <span className="flex items-center gap-1.5 text-gray-500 cursor-default">
                <PaymentIcon />
                Online Payment
              </span>
              <span className="flex items-center gap-1.5 text-gray-500 cursor-default">
                <RewardsIcon />
                PRURewards
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-pru-gray-light rounded-full p-0.5 text-xs font-medium">
                <span className="px-3 py-1.5 rounded-full bg-white shadow-sm text-pru-gray-dark">
                  Personal
                </span>
                <span className="px-3 py-1.5 text-gray-500">Enterprise</span>
              </div>
              <button type="button" className="btn-login hidden sm:inline-flex">
                Login
              </button>
              <Link
                href="/agent"
                className="text-xs sm:text-sm font-medium text-white bg-pru-red hover:bg-pru-red-dark px-3 sm:px-4 py-2 rounded-full transition-colors"
              >
                Agent Copilot
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main red navigation */}
      <nav className="bg-pru-red">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
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

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function RewardsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );
}
