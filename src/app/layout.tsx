import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prudential | Contact Us",
  description:
    "Prudential conversational AI assistant and agent copilot prototype for insurance customer service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-pru-gray-dark">
        {children}
      </body>
    </html>
  );
}
