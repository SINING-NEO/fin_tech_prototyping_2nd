import { AgentHeader } from "@/components/AgentHeader";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-pru-gray-light flex flex-col">
      <AgentHeader />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
