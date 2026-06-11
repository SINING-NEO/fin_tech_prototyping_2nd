import { CustomerHeader } from "@/components/CustomerHeader";
import { ChatWidget } from "@/components/ChatWidget";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CustomerHeader />
      {children}
      <ChatWidget />
    </>
  );
}
