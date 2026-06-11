import { AgentHeader } from "@/components/AgentHeader";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-pru-gray-light">
      <AgentHeader />
      {children}
    </div>
  );
}
