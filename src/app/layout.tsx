import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prudential | Insurance Navigator",
  description:
    "PruAssist Insurance Navigator for customers and Financial Representative Copilot portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-pru-gray-dark">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
