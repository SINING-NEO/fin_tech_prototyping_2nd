import { Header } from "@/components/Header";
import { InsuranceNavigator } from "@/components/navigator/InsuranceNavigator";

export default function ChatPage() {
  return (
    <>
      <Header />
      <div className="bg-pru-gray-light min-h-[calc(100vh-7rem)] py-6 px-4">
        <div className="max-w-2xl mx-auto h-[calc(100vh-10rem)] bg-white rounded-2xl shadow-chat border border-pru-gray-border overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-pru-red text-white flex-shrink-0">
            <h1 className="font-semibold text-lg">Need help? Talk to us</h1>
            <p className="text-xs text-red-100 mt-0.5">Insurance Navigator — plain language, advisor-led decisions</p>
          </div>
          <div className="flex-1 min-h-0">
            <InsuranceNavigator />
          </div>
        </div>
      </div>
    </>
  );
}
