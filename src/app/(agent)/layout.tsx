import { AgentHeader } from "@/components/AgentHeader";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-pru-gray-light">
      <AgentHeader />
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
