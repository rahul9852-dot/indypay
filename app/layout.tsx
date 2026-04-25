import type { Metadata } from "next";
import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import AosProvider from "@/components/ui/AosProvider";
import { ContactDrawerProvider } from "@/components/ui/ContactDrawerContext";
import ContactDrawer from "@/components/ui/ContactDrawer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
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
      className={`${geistSans.variable} ${jakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ContactDrawerProvider>
          <AosProvider>{children}</AosProvider>
          <ContactDrawer />
        </ContactDrawerProvider>
      </body>
    </html>
  );
}
