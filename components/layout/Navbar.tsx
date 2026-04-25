'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useContactDrawer } from "@/components/ui/ContactDrawerContext";

/* ─── nav data ─────────────────────────────────────────────────────────── */
type BusinessMenuItem = { label: string; href: string; desc?: string };

const BUSINESS_MENU = {
  acceptPayments: [
    { label: "Omni Channel", href: "/business/omni-channel", desc: "Accept payments across online and offline touchpoints." },
    { label: "In Store", href: "/business/in-store", desc: "POS and QR payments for your physical store." },
    { label: "Online", href: "/business/online", desc: "Payment gateway for website and app checkouts." },
    { label: "Pay Later", href: "/business/pay-later", desc: "Offer EMI / BNPL to improve conversions." },
    { label: "Global Collections", href: "/business/global-collections", desc: "Collect international payments with ease." },
  ] satisfies BusinessMenuItem[],
  makePayments: [
    { label: "Payouts", href: "/business/payouts", desc: "Bulk payouts to vendors, partners, and customers." },
    { label: "Utility Bill Payments", href: "/business/payouts#utility-bill-payments", desc: "Pay utilities quickly from one place." },
    { label: "Cards", href: "/business/payouts#cards", desc: "Issue and manage cards for teams and expenses." },
    { label: "Expense Management", href: "/business/payouts#expense-management", desc: "Track and control spend across departments." },
    { label: "Tax Management", href: "/business/payouts#tax-management", desc: "Simplify payments and tracking for taxes." },
  ] satisfies BusinessMenuItem[],
  manageYourBusiness: [
    { label: "Business Dashboard", href: "/business/dashboard", desc: "One view for payments, settlements, and performance." },
    { label: "Business Khata", href: "/business/dashboard#business-khata", desc: "Manage ledgers and customer credit cycles." },
    { label: "Business Loans", href: "/business/dashboard#business-loans", desc: "Access working capital tailored to your business." },
    { label: "Business Insights", href: "/business/dashboard#business-insights", desc: "Actionable analytics to grow revenue." },
    { label: "Loyalty", href: "/business/dashboard#loyalty", desc: "Engage and retain customers with rewards." },
    { label: "Risk & AML", href: "/business/dashboard#risk-aml", desc: "Fraud checks, monitoring, and compliance tools." },
    { label: "Reconciliation & Settlement", href: "/business/dashboard#reconciliation-settlement", desc: "Automate reconciliation and track settlements." },
    { label: "Cards", href: "/business/payouts#cards", desc: "Corporate cards to manage spend efficiently." },
  ] satisfies BusinessMenuItem[],
};

type MenuItem = { label: string; href: string; desc?: string };

function isHashHref(href: string) {
  return href === "#" || href.startsWith("#");
}

function MenuIcon({ name }: { name: string }) {
  switch (name) {
    case "no-code":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
        </svg>
      );
    case "pay later":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10m4 3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "invoicepay":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case "nowpay":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case "government business":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-6 9 6v2H3v-2zM5 12v8m4-8v8m6-8v8m4-8v8M4 20h16" />
        </svg>
      );
    case "schoolpay":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-7-4l7 4 7-4" />
        </svg>
      );
    case "hotelpay":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 11h16a2 2 0 012 2v6H2v-6a2 2 0 012-2zm2-7h6a3 3 0 013 3v4H6V4z"
          />
        </svg>
      );
    case "healthcarepay":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 3h4a2 2 0 012 2v1H8V5a2 2 0 012-2z" />
        </svg>
      );
    case "bfsipay":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-6 9 6v2H3v-2zM6 12v8m4-8v8m4-8v8m4-8v8M4 20h16" />
        </svg>
      );
    case "societypay":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 20v-6a2 2 0 012-2h4a2 2 0 012 2v6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10l6-5 6 5v10H6V10z" />
        </svg>
      );
    case "Platform":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "Payments in a Box":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10m0 0l-8-4V7"
          />
        </svg>
      );
    case "Embedded Finance":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
        </svg>
      );
    case "CMS":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h6" />
        </svg>
      );
    case "Card in a Box":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18v10H3V7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11h18" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 15h4" />
        </svg>
      );
    case "Financial Inclusion":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0"
          />
        </svg>
      );
    case "Cash Management Services":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h6l3-9 6 18 3-9h3" />
        </svg>
      );
    case "About IndyPay":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "Challenge Yourself":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3 7h7l-5.5 4 2.5 7-7-4.5L5 20l2.5-7L2 9h7l3-7z" />
        </svg>
      );
    case "Culture":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20H2v-2a3 3 0 015.356-1.857" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      );
    case "Partner with Us":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V9a3 3 0 013-3h2a3 3 0 013 3v2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13h10l-1 8H8l-1-8z" />
        </svg>
      );
    case "Media Centre":
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 4v6h6" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
}

const SOLUTIONS_MENU = {
  quickStarts: [
    { label: "no-code", href: "/solutions/nocode", desc: "Start collecting payments without any integration." },
    { label: "pay later", href: "/business/pay-later", desc: "Offer EMI and deferred payment options." },
    { label: "invoicepay", href: "/solutions/invoices", desc: "Send invoices with built-in payment links." },
    { label: "nowpay", href: "/solutions/nowpay", desc: "Create instant links and get paid fast." },
  ] satisfies MenuItem[],
  industries: [
    { label: "government business", href: "/solutions/government-business", desc: "Compliant collections for public services." },
    { label: "schoolpay", href: "/solutions/schoolpay", desc: "Fees, admissions, and digital receipts." },
    { label: "hotelpay", href: "/solutions/hotelpay", desc: "Bookings, deposits, and add-on payments." },
    { label: "healthcarepay", href: "/solutions/healthcarepay", desc: "OPD/IPD billing and payment reminders." },
    { label: "societypay", href: "/solutions/societypay", desc: "Maintenance collections and member dues." },
    { label: "bfsipay", href: "/solutions/bfsipay", desc: "Payments tailored for BFSI workflows." },
  ] satisfies MenuItem[],
};

type PlatformMenuItem = { label: string; href: string; desc: string; accent: string };

const PLATFORM_MENU: PlatformMenuItem[] = [
  { label: "Platform", href: "/platform", desc: "A unified stack to launch, manage, and scale payments.", accent: "from-[#7B4DB5] to-[#3B5FD4]" },
  { label: "Payments in a Box", href: "/platform/payments-in-a-box", desc: "All the essentials you need to go live quickly.", accent: "from-[#7B4DB5] to-[#3B5FD4]" },
  { label: "Embedded Finance", href: "/platform/embedded-finance", desc: "Build financial products directly into your user flows.", accent: "from-[#7B4DB5] to-[#3B5FD4]" },
  { label: "Cash Management Services", href: "/platform/cash-management-services", desc: "360-degree fund flow management for businesses.", accent: "from-[#7B4DB5] to-[#3B5FD4]" },
  { label: "CMS", href: "/platform/cms", desc: "Configure products, pricing, and content without code.", accent: "from-[#7B4DB5] to-[#3B5FD4]" },
  { label: "Card in a Box", href: "/platform/card-in-a-box", desc: "Issue cards and control spend with policy and limits.", accent: "from-[#7B4DB5] to-[#3B5FD4]" },
  { label: "Financial Inclusion", href: "/platform/financial-inclusion", desc: "Reach underserved users with accessible payment rails.", accent: "from-[#7B4DB5] to-[#3B5FD4]" },
];

const ABOUT_MENU = [
  { label: "About IndyPay", href: "/about", desc: "Who we are, what we build, and why it matters." },
  { label: "Culture", href: "/about/culture", desc: "How we work—principles, practices, and people." },
  { label: "Partner with Us", href: "/about/partner-with-us", desc: "Build together with APIs, programs, and support." },
  { label: "Media Centre", href: "/about/media-centre", desc: "News, updates, brand kit, and announcements." },
];

const NAV = [
  { label: "Business", hasDropdown: true, href: undefined },
  { label: "Solutions", hasDropdown: true, href: undefined },
  { label: "Platform", hasDropdown: true, href: undefined },
  { label: "Developer Hub", hasDropdown: false, href: "/developer-hub" },
  { label: "About Us", hasDropdown: true, href: undefined },
];

/* ─── Simple Navbar ───────────────────────────────────────────────────── */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { openDrawer } = useContactDrawer();

  return (
    <>
      {/* ── Simple navbar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/indypay.svg"
              alt="IndyPay"
              width={110}
              height={36}
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-8">
            {NAV.map((item) => (
              <li 
                key={item.label}
                className="relative"
                onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {item.href ? (
                  <Link href={item.href} className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-[#7B4DB5] transition-colors py-6">
                    {item.label}
                  </Link>
                ) : (
                  <button className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-[#7B4DB5] transition-colors py-6">
                    {item.label}
                    {item.hasDropdown && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Business Dropdown */}
                {item.label === "Business" && activeDropdown === "Business" && (
                  <div className="absolute top-full left-0 pt-2 w-[750px]">
                    <div className="bg-white rounded-lg shadow-2xl border border-slate-200 p-5">
                      <div className="grid grid-cols-4 gap-x-6 gap-y-3">
                        {/* Accept Payments Section */}
                        <div className="col-span-4 mb-0.5">
                          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Accept Payments</h3>
                        </div>
                        {BUSINESS_MENU.acceptPayments.map((subItem, idx) => {
                          const icons = [
                            // Omni Channel
                            <svg key="omni" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>,
                            // In Store
                            <svg key="store" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>,
                            // Online
                            <svg key="online" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>,
                            // Pay Later
                            <svg key="paylater" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>,
                            // Global Collections
                            <svg key="global" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ];
                          return (
                            <a 
                              key={subItem.label}
                              href={subItem.href} 
                              className="flex items-start gap-2.5 text-sm text-slate-800 hover:text-[#7B4DB5] transition-colors group"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 group-hover:bg-[#7B4DB5] transition-colors">
                                {icons[idx]}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-[13px] leading-tight">{subItem.label}</div>
                                {subItem.desc && (
                                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{subItem.desc}</div>
                                )}
                              </div>
                            </a>
                          );
                        })}

                        {/* Make Payments Section */}
                        <div className="col-span-4 mb-0.5 mt-2.5">
                          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Make Payments</h3>
                        </div>
                        {BUSINESS_MENU.makePayments.map((subItem, idx) => {
                          const icons = [
                            // Payouts
                            <svg key="payouts" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>,
                            // Utility Bill Payments
                            <svg key="utility" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>,
                            // Cards
                            <svg key="cards" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>,
                            // Expense Management
                            <svg key="expense" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>,
                            // Tax Management
                            <svg key="tax" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                            </svg>
                          ];
                          return (
                            <a 
                              key={subItem.label}
                              href={subItem.href} 
                              className="flex items-start gap-2.5 text-sm text-slate-800 hover:text-[#7B4DB5] transition-colors group"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 group-hover:bg-[#7B4DB5] transition-colors">
                                {icons[idx]}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-[13px] leading-tight">{subItem.label}</div>
                                {subItem.desc && (
                                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{subItem.desc}</div>
                                )}
                              </div>
                            </a>
                          );
                        })}

                        {/* Manage Your Business Section */}
                        <div className="col-span-4 mb-0.5 mt-2.5">
                          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Manage Your Business</h3>
                        </div>
                        {BUSINESS_MENU.manageYourBusiness.map((subItem, idx) => {
                          const icons = [
                            // Business Dashboard
                            <svg key="dashboard" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>,
                            // Business Khata
                            <svg key="khata" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>,
                            // Business Loans
                            <svg key="loans" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h10M9 12h10M9 16h6m-3-8V6a2 2 0 012-2h2" />
                            </svg>,
                            // Business Insights
                            <svg key="insights" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>,
                            // Loyalty
                            <svg key="loyalty" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>,
                            // Risk & AML
                            <svg key="risk" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>,
                            // Reconciliation & Settlement
                            <svg key="reconciliation" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>,
                            // Cards
                            <svg key="cards2" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          ];
                          return (
                            <a 
                              key={subItem.label}
                              href={subItem.href} 
                              className="flex items-start gap-2.5 text-sm text-slate-800 hover:text-[#7B4DB5] transition-colors group"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 group-hover:bg-[#7B4DB5] transition-colors">
                                {icons[idx]}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-[13px] leading-tight">{subItem.label}</div>
                                {subItem.desc && (
                                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{subItem.desc}</div>
                                )}
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Solutions Dropdown */}
                {item.label === "Solutions" && activeDropdown === "Solutions" && (
                  <div className="absolute top-full left-0 pt-2 w-[750px]">
                    <div className="bg-white rounded-lg shadow-2xl border border-slate-200 p-5">
                      <div className="grid grid-cols-4 gap-x-6 gap-y-3">
                        {/* Quick Starts Section */}
                        <div className="col-span-4 mb-0.5">
                          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Quick Starts</h3>
                        </div>
                        {SOLUTIONS_MENU.quickStarts.map((subItem) => (
                          isHashHref(subItem.href) ? (
                            <a
                              key={subItem.label}
                              href={subItem.href}
                              className="flex items-start gap-2.5 text-sm text-slate-800 hover:text-[#7B4DB5] transition-colors group"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 group-hover:bg-[#7B4DB5] transition-colors">
                                <MenuIcon name={subItem.label} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-[13px] leading-tight">{subItem.label}</div>
                                {subItem.desc && (
                                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{subItem.desc}</div>
                                )}
                              </div>
                            </a>
                          ) : (
                            <Link
                              key={subItem.label}
                              href={subItem.href}
                              className="flex items-start gap-2.5 text-sm text-slate-800 hover:text-[#7B4DB5] transition-colors group"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 group-hover:bg-[#7B4DB5] transition-colors">
                                <MenuIcon name={subItem.label} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-[13px] leading-tight">{subItem.label}</div>
                                {subItem.desc && (
                                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{subItem.desc}</div>
                                )}
                              </div>
                            </Link>
                          )
                        ))}

                        {/* Industry Solutions Section */}
                        <div className="col-span-4 mb-0.5 mt-2.5">
                          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Industry Solutions</h3>
                        </div>
                        {SOLUTIONS_MENU.industries.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className="flex items-start gap-2.5 text-sm text-slate-800 hover:text-[#7B4DB5] transition-colors group"
                            onClick={() => setActiveDropdown(null)}
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 group-hover:bg-[#7B4DB5] transition-colors">
                              <MenuIcon name={subItem.label} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-[13px] leading-tight">{subItem.label}</div>
                              {subItem.desc && (
                                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{subItem.desc}</div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Platform Dropdown */}
                {item.label === "Platform" && activeDropdown === "Platform" && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[820px]">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                      <div className="grid grid-cols-12">
                        <div className="col-span-7 p-6">
                          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-4">Platform</h3>
                          <div className="space-y-3">
                            {PLATFORM_MENU.map((subItem) => (
                              <Link
                                key={subItem.label}
                                href={subItem.href}
                                className="group flex items-start gap-3 rounded-lg p-2 -m-2 hover:bg-slate-50 transition-colors"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <div
                                  className={`w-9 h-9 rounded-full bg-linear-to-br ${subItem.accent} flex items-center justify-center shrink-0`}
                                >
                                  <MenuIcon name={subItem.label} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-900 group-hover:text-[#7B4DB5] transition-colors">
                                    {subItem.label}
                                  </div>
                                  <div className="text-xs text-slate-500 leading-snug mt-0.5">{subItem.desc}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>

                        <div className="col-span-5 bg-slate-50 border-l border-slate-200 p-6">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Highlights</p>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-sm font-black text-slate-900">Launch faster</div>
                                  <div className="text-xs text-slate-600 mt-0.5">Prebuilt flows and configs to go live quickly.</div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h6l3-9 6 18 3-9h3" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-sm font-black text-slate-900">Operate with clarity</div>
                                  <div className="text-xs text-slate-600 mt-0.5">Dashboards, reports, and controls built-in.</div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-fuchsia-600 to-pink-600 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-sm font-black text-slate-900">Scale securely</div>
                                  <div className="text-xs text-slate-600 mt-0.5">Policy, limits, and compliance-ready tooling.</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* About Us Dropdown */}
                {item.label === "About Us" && activeDropdown === "About Us" && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[820px]">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                      <div className="grid grid-cols-12">
                        <div className="col-span-7 p-6">
                          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-4">About</h3>
                          <div className="space-y-3">
                            {ABOUT_MENU.map((subItem) => (
                              <Link
                                key={subItem.label}
                                href={subItem.href}
                                className="group flex items-start gap-3 rounded-lg p-2 -m-2 hover:bg-slate-50 transition-colors"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#7B4DB5] to-[#3B5FD4] flex items-center justify-center shrink-0">
                                  <MenuIcon name={subItem.label} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-900 group-hover:text-[#7B4DB5] transition-colors">
                                    {subItem.label}
                                  </div>
                                  {subItem.desc && <div className="text-xs text-slate-500 leading-snug mt-0.5">{subItem.desc}</div>}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>

                        <div className="col-span-5 bg-slate-50 border-l border-slate-200 p-6">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Inside IndyPay</p>
                          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                            <div className="p-5">
                              <div className="text-sm font-black text-slate-900">Vision • Mission • Values</div>
                              <div className="text-xs text-slate-600 mt-1">
                                What we optimise for and how we build trust at scale.
                              </div>
                            </div>
                            <div className="px-5 pb-5">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                                <Image
                                  src="/images/about/about-3.png"
                                  alt="IndyPay vision and mission illustration"
                                  width={900}
                                  height={600}
                                  className="w-full h-auto"
                                  style={{ filter: "hue-rotate(250deg) saturate(1.25) contrast(1.05)" }}
                                />
                              </div>
                              <Link
                                href="/about"
                                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#7B4DB5] hover:gap-3 transition-all"
                                onClick={() => setActiveDropdown(null)}
                              >
                                Explore About IndyPay
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


              </li>
            ))}
          </ul>

          {/* Right CTAs */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={openDrawer}
              className="px-6 py-2.5 bg-[#7B4DB5] text-white text-sm font-bold rounded-lg hover:bg-[#6A3BA0] transition-all"
            >
              Get Started
            </button>
          </div>

          {/* Mobile burger */}
          <button
            className="lg:hidden p-2 text-slate-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <div className="px-6 py-4 space-y-4">
              {/* Business Section */}
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Business</p>
                <div className="space-y-2 pl-4">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Accept Payments</p>
                  {BUSINESS_MENU.acceptPayments.map((item) => (
                    <a key={item.label} href="#" className="block text-sm text-slate-700 py-1">
                      {item.label}
                    </a>
                  ))}
                  <p className="text-xs font-semibold text-slate-500 mb-1 mt-3">Make Payments</p>
                  {BUSINESS_MENU.makePayments.map((item) => (
                    <a key={item.label} href="#" className="block text-sm text-slate-700 py-1">
                      {item.label}
                    </a>
                  ))}
                  <p className="text-xs font-semibold text-slate-500 mb-1 mt-3">Manage Your Business</p>
                  {BUSINESS_MENU.manageYourBusiness.map((item) => (
                    <a key={item.label} href="#" className="block text-sm text-slate-700 py-1">
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Solutions */}
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Solutions</p>
                <div className="space-y-2 pl-4">
                  {[...SOLUTIONS_MENU.quickStarts, ...SOLUTIONS_MENU.industries].map((item) => (
                    isHashHref(item.href) ? (
                      <a key={item.label} href={item.href} className="block text-sm text-slate-700 py-1">
                        {item.label}
                      </a>
                    ) : (
                      <Link key={item.label} href={item.href} className="block text-sm text-slate-700 py-1">
                        {item.label}
                      </Link>
                    )
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Platform</p>
                <div className="space-y-2 pl-4">
                  {PLATFORM_MENU.map((item) => (
                    <a key={item.label} href="#" className="block text-sm text-slate-700 py-1">
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Developer Hub */}
              <a href="#" className="block text-sm font-semibold text-slate-700 hover:text-[#7B4DB5] py-2">
                Developer Hub
              </a>

              {/* About Us */}
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">About Us</p>
                <div className="space-y-2 pl-4">
                  {ABOUT_MENU.map((item) => (
                    <Link key={item.label} href={item.href} className="block text-sm text-slate-700 py-1">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
                <button onClick={openDrawer} className="text-center py-2.5 bg-[#7B4DB5] text-white text-sm font-bold rounded-lg">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
