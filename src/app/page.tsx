import Link from "next/link";
import { Header } from "@/components/Header";
import { ChatWidget } from "@/components/ChatWidget";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        {/* Hero */}
        <section className="relative">
          <div
            className="relative h-[320px] sm:h-[400px] bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.05), rgba(0,0,0,0)), url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1400&q=80')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Contact Us card */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-24 sm:-mt-28 mb-12">
              <div className="bg-white shadow-lg rounded-sm p-8 sm:p-10 max-w-md ml-auto border border-pru-gray-border">
                <h1 className="text-3xl sm:text-4xl font-bold text-pru-gray-dark tracking-tight">
                  Contact Us
                </h1>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Your Insurance Navigator helps you understand policy topics in plain
                  language and connects you with your Financial Representative when
                  personalized guidance matters.
                </p>
                <Link
                  href="/chat"
                  className="inline-block mt-6 text-pru-red font-medium hover:underline"
                >
                  Start a conversation →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Did you know? */}
        <section className="bg-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-pru-gray-dark mb-8">
              Did you know?
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <PromoCard
                title="Insurance Navigator — plain language support"
                description="PruAssist explains complex policy terms in everyday language so you feel informed before speaking with your Financial Representative."
                cta="Try the navigator"
                href="/chat"
              />
              <PromoCard
                title="Built to empower advisors"
                description="Our AI supports Financial Representatives with simplified explanations and suitability prompts — it never replaces human judgment."
                cta="View advisor workspace"
                href="/agent"
              />
            </div>
          </div>
        </section>

        {/* Design principles banner */}
        <section className="bg-pru-red text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-red-100 text-sm uppercase tracking-wider font-medium">
              Insurance Navigator
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold">
              Empower advisors. Simplify language. Build confidence.
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-red-50 text-sm sm:text-base leading-relaxed">
              Designed to support Financial Representatives — not replace them. Simplify
              complex policy language, support suitability conversations, and help
              customers feel confident in the advisory process.
            </p>
          </div>
        </section>

        {/* Prototype info — subtle gray section */}
        <section className="bg-pru-gray-light py-14 border-t border-pru-gray-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-pru-gray-dark mb-8 text-center">
              Poly-Fintech Prototype Features
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                title="Insurance Navigator"
                description="Intent → profiling → match → compare → confidence meter → summary handoff to your Financial Representative."
                href="/chat"
              />
              <FeatureCard
                title="Policy comparison"
                description="Explains covers, good-for, limitations, and estimated premium ranges in plain language."
                href="/chat"
              />
              <FeatureCard
                title="FR Copilot + Handoff"
                description="Reps receive customer demographics, plans considered, confidence level, and AI-assisted reply drafts."
                href="/agent"
              />
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-5 text-sm text-amber-900">
            <strong>Prototype disclaimer:</strong> Academic project not affiliated with
            Prudential. Knowledge sourced from public FAQ material for demonstration only.
          </div>
        </section>
      </main>

      <footer className="bg-pru-gray-dark text-gray-300 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} Prudential AI Copilot Prototype</p>
      </footer>

      <ChatWidget />
    </>
  );
}

function PromoCard({
  title,
  description,
  cta,
  href,
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="bg-pru-gray-light rounded-sm p-6 sm:p-8 border border-pru-gray-border hover:shadow-md transition-shadow">
      <h3 className="text-lg font-bold text-pru-gray-dark">{title}</h3>
      <p className="mt-3 text-gray-600 leading-relaxed text-sm sm:text-base">{description}</p>
      <Link href={href} className="inline-block mt-4 text-pru-red font-medium text-sm hover:underline">
        {cta} →
      </Link>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="bg-white rounded-sm p-6 border border-pru-gray-border">
      <h3 className="font-bold text-pru-gray-dark">{title}</h3>
      <p className="mt-2 text-gray-600 text-sm leading-relaxed">{description}</p>
      <Link href={href} className="inline-block mt-4 text-pru-red text-sm font-medium hover:underline">
        Open →
      </Link>
    </div>
  );
}
