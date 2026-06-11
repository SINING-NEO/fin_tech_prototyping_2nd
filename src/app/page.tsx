import Link from "next/link";
import { PrudentialLogo } from "@/components/PrudentialLogo";
import { PortalChooser } from "@/components/PortalChooser";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-pru-gray-light flex flex-col">
      <header className="bg-white border-b border-pru-gray-border py-6">
        <div className="max-w-4xl mx-auto px-4 flex justify-center">
          <PrudentialLogo />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <p className="text-pru-red text-sm font-medium uppercase tracking-wider">
              Poly-Fintech Prototype
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-pru-gray-dark">
              Insurance Navigator Platform
            </h1>
            <p className="mt-4 text-gray-600 max-w-xl mx-auto leading-relaxed">
              Choose your portal. Customer and agent views run locally on the same server
              and connect in real time for live demonstration.
            </p>
          </div>

          <PortalChooser />

          <div className="mt-10 p-4 bg-white border border-pru-gray-border rounded-lg text-sm text-gray-600">
            <p className="font-medium text-pru-gray-dark mb-2">Demo tip — two tabs</p>
            <ol className="list-decimal ml-5 space-y-1 text-xs sm:text-sm">
              <li>Use the <strong>same URL/port</strong> in both tabs (e.g. both on localhost:3000)</li>
              <li>Tab 1: <strong>Customer</strong> → complete navigator → &quot;Chat live with Financial Representative&quot;</li>
              <li>Tab 2: <strong>Agent</strong> (password <code className="text-pru-red">prudential2025</code>) → accept from queue → chat live</li>
            </ol>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-500">
        <p>Prototype — not affiliated with Prudential Financial</p>
        <Link href="/login" className="text-pru-red hover:underline mt-1 inline-block">
          Advanced login options
        </Link>
      </footer>
    </div>
  );
}
