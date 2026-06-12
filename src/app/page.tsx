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
              Consultation Workflow Platform
            </h1>
            <p className="mt-4 text-gray-600 max-w-xl mx-auto leading-relaxed">
              AI supports financial representatives in delivering clearer, more consistent insurance consultations —
              from guided intake to live assistance and post-meeting summary.
            </p>
          </div>

          <PortalChooser />

          <div className="mt-10 p-4 bg-white border border-pru-gray-border rounded-lg text-sm text-gray-600">
            <p className="font-medium text-pru-gray-dark mb-2">Demo tip — two tabs</p>
            <ol className="list-decimal ml-5 space-y-1 text-xs sm:text-sm">
              <li><strong>Customer:</strong> Complete guided intake → book consultation → share Session ID</li>
              <li><strong>Agent:</strong> Load Session ID or pick from queue → review pre-meeting brief → live consultation</li>
              <li>End consultation → AI generates post-meeting summary for follow-up</li>
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
