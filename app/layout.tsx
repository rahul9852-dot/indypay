import type { Metadata } from "next";
import { Geist } from "next/font/google";
import AosProvider from "@/components/ui/AosProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IndyPay — Every Payment. Every Channel. One Platform.",
  description:
    "IndyPay is India's unified fintech infrastructure — accept UPI, cards, wallets, POS and more with a single integration across 22+ banking partners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <AosProvider>{children}</AosProvider>
        </body>
    </html>
  );
}
