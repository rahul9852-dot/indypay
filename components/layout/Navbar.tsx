'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";

/* ─── nav data ─────────────────────────────────────────────────────────── */
const NAV = [
  {
    label: "Products",
    icon: "💳",
    children: [
      { label: "Accept Payments", desc: "UPI, cards, wallets & more" },
      { label: "Send Money",      desc: "Instant bank transfers" },
      { label: "Payment Links",   desc: "Share & collect anywhere" },
      { label: "QR & POS",        desc: "In-store terminal solutions" },
    ],
  },
  {
    label: "Solutions",
    icon: "🏗️",
    children: [
      { label: "Education",   desc: "Cashless campus fees" },
      { label: "Retail",      desc: "Omnichannel checkout" },
      { label: "Hospitality", desc: "Hotel & restaurant billing" },
      { label: "BFSI",        desc: "Collections & disbursals" },
      { label: "Logistics",   desc: "COD & vendor settlement" },
      { label: "Healthcare",  desc: "Patient-first billing" },
    ],
  },
  {
    label: "Platform",
    icon: "⚡",
    children: [
      { label: "Open API",            desc: "REST, SDKs & webhooks" },
      { label: "Embedded Finance",    desc: "BaaS without a licence" },
      { label: "Financial Inclusion", desc: "Reach the next 400M" },
    ],
  },
  { label: "Developers", icon: "🛠️", children: [] },
  {
    label: "About",
    icon: "🏢",
    children: [
      { label: "Company",  desc: "Our story & mission" },
      { label: "Careers",  desc: "Join the team" },
      { label: "Blog",     desc: "Insights & updates" },
      { label: "Partners", desc: "Grow with us" },
    ],
  },
];

/* ─── Floating Navbar ───────────────────────────────────────────────────── */
export default function Navbar() {
  const [visible, setVisible]         = useState(true);
  const [atTop, setAtTop]             = useState(true);
  const [activeMenu, setActiveMenu]   = useState<string | null>(null);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [hovered, setHovered]         = useState<string | null>(null);
  const closeTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollY                   = useRef(0);
  const { scrollY }                   = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setAtTop(y < 10);
    setVisible(y < lastScrollY.current || y < 80);
    lastScrollY.current = y;
  });

  const openMenu  = (label: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setActiveMenu(label); };
  const closeMenu = () => { closeTimer.current = setTimeout(() => setActiveMenu(null), 120); };

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  return (
    <>
      {/* ── Floating pill navbar ───────────────────────────────────────── */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: visible ? 0 : -110, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
      >
        <div
          className={`pointer-events-auto w-full max-w-6xl rounded-2xl transition-all duration-300 ${
            atTop
              ? "bg-transparent border border-white/10"
              : "bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl shadow-slate-900/10"
          }`}
        >
          <nav className="flex items-center justify-between px-5 h-14">

            {/* Logo — white pill badge on dark hero, plain on light nav */}
            <Link href="/" className="shrink-0 flex items-center">
              <span
                className={`transition-all duration-300 ${
                  atTop
                    ? "bg-white rounded-xl px-2.5 py-1 shadow-md"
                    : ""
                }`}
              >
                <Image
                  src="/images/indypay-logo.png"
                  alt="IndyPay"
                  width={110}
                  height={36}
                  className="object-contain block"
                  priority
                />
              </span>
            </Link>

            {/* Desktop links */}
            <ul className="hidden lg:flex items-center">
              {NAV.map((item) => (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => openMenu(item.label)}
                  onMouseLeave={closeMenu}
                >
                  <button
                    onMouseEnter={() => setHovered(item.label)}
                    onMouseLeave={() => setHovered(null)}
                    className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                      atTop
                        ? "text-white/90 hover:text-white"
                        : "text-slate-600 hover:text-[#1E2A7A]"
                    }`}
                  >
                    {/* Animated background pill on hover */}
                    {hovered === item.label && (
                      <motion.span
                        layoutId="nav-hovered"
                        className={`absolute inset-0 rounded-xl ${atTop ? "bg-white/10" : "bg-[#3B5FD4]/8"}`}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                    {item.children.length > 0 && (
                      <motion.svg
                        animate={{ rotate: activeMenu === item.label ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 w-3.5 h-3.5 opacity-50"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    )}
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {activeMenu === item.label && item.children.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        onMouseEnter={() => openMenu(item.label)}
                        onMouseLeave={closeMenu}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 overflow-hidden"
                      >
                        {/* Top gradient accent */}
                        <div className="h-0.5 bg-linear-to-r from-[#3B5FD4] via-[#6BA3E8] to-[#7B4DB5] mb-2" />
                        {item.children.map((child, ci) => (
                          <motion.a
                            key={child.label}
                            href="#"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: ci * 0.04 }}
                            className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 group transition-colors"
                          >
                            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#3B5FD4] shrink-0 group-hover:bg-[#7B4DB5] transition-colors" />
                            <div>
                              <p className="text-sm font-semibold text-[#1E2A7A] group-hover:text-[#3B5FD4] transition-colors">
                                {child.label}
                              </p>
                              {"desc" in child && (
                                <p className="text-xs text-slate-400 mt-0.5">{child.desc}</p>
                              )}
                            </div>
                          </motion.a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>

            {/* Right CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href="#"
                className={`text-sm font-medium transition-colors ${
                  atTop ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-[#1E2A7A]"
                }`}
              >
                Log in
              </a>
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative px-5 py-2 bg-[#7B4DB5] text-white text-sm font-bold rounded-xl overflow-hidden shadow-lg shadow-purple-600/25 transition-colors hover:bg-[#6A3BA0]"
              >
                {/* Shimmer sweep */}
                <motion.span
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  initial={{ x: "-150%" }}
                  whileHover={{ x: "150%" }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                />
                <span className="relative z-10">Get Started →</span>
              </motion.a>
            </div>

            {/* Mobile burger */}
            <button
              className={`lg:hidden p-2 rounded-xl transition-colors ${atTop ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <motion.svg
                className="w-5 h-5"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                animate={mobileOpen ? "open" : "closed"}
              >
                <motion.path
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  variants={{
                    closed: { d: "M4 6h16M4 12h16M4 18h16" },
                    open:   { d: "M6 18L18 6M6 6l12 12" },
                  }}
                  transition={{ duration: 0.2 }}
                />
              </motion.svg>
            </button>
          </nav>
        </div>
      </motion.header>

      {/* ── Mobile menu ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-4 top-20 z-40 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            {/* Top gradient bar */}
            <div className="h-1 bg-linear-to-r from-[#1E2A7A] via-[#6BA3E8] to-[#7B4DB5]" />

            <div className="p-5">
              <Image src="/images/indypay-logo.png" alt="IndyPay" width={100} height={34} className="mb-5" />

              <div className="space-y-4">
                {NAV.map((item) => (
                  <div key={item.label}>
                    <p className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      <span>{item.icon}</span>
                      {item.label}
                    </p>
                    {item.children.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1">
                        {item.children.map((c) => (
                          <a
                            key={c.label}
                            href="#"
                            className="px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-[#3B5FD4]/8 hover:text-[#3B5FD4] transition-colors font-medium"
                          >
                            {c.label}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <a href="#" className="block px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-[#3B5FD4]/8 hover:text-[#3B5FD4] transition-colors font-medium">
                        {item.label}
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100 flex gap-3">
                <a href="#" className="flex-1 text-center py-2.5 rounded-xl border-2 border-[#3B5FD4] text-[#3B5FD4] text-sm font-bold hover:bg-blue-50 transition-colors">
                  Log in
                </a>
                <a href="#contact" className="flex-1 text-center py-2.5 rounded-xl bg-[#7B4DB5] text-white text-sm font-bold hover:bg-[#6A3BA0] transition-colors">
                  Get Started →
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-outside overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
