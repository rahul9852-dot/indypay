import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FaqAccordion from "./FaqAccordion";
import ContactCTAButton from "@/components/ui/ContactCTAButton";
import AnimatedDiv from "./AnimatedDiv";
import NoCodeHeroCanvas from "./NoCodeHeroCanvas";

/* ─── Shared icon helpers ──────────────────────────────────────────────── */
const Check = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

/* ─── Phone mockup (Product Experience section) ────────────────────────── */
const PaymentPhoneMockup = () => (
  <div className="relative flex items-center justify-center py-8 px-4">
    <div className="absolute inset-0 bg-[#7B4DB5]/8 rounded-3xl blur-3xl" />
    <div className="relative w-56 sm:w-60 rounded-[2.5rem] border-[5px] border-slate-200 bg-white shadow-2xl overflow-hidden">
      {/* Status bar */}
      <div className="bg-[#7B4DB5] px-5 py-3 flex items-center justify-between">
        <span className="text-white text-xs font-bold tracking-wide">IndyPay</span>
        <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      {/* Screen */}
      <div className="p-4">
        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Amount due</div>
        <div className="text-2xl font-black text-slate-900 mb-4">₹1,499.00</div>
        {[
          { label: 'UPI', icon: '⚡' },
          { label: 'Credit / Debit Card', icon: '💳' },
          { label: 'Net Banking', icon: '🏦' },
          { label: 'Wallets', icon: '👝' },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50 mb-2">
            <span className="text-base leading-none">{m.icon}</span>
            <span className="text-xs font-semibold text-slate-700">{m.label}</span>
            <svg className="w-3.5 h-3.5 text-slate-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
        <button className="w-full mt-3 py-3 bg-[#7B4DB5] text-white text-sm font-bold rounded-xl hover:bg-[#6A3BA0] transition-colors">
          Pay Now
        </button>
        <div className="flex items-center justify-center gap-1 mt-3">
          <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-[10px] text-slate-300">Secured by IndyPay</span>
        </div>
      </div>
    </div>

    {/* Floating success card — hidden on xs to avoid overflow */}
    <div className="hidden sm:flex absolute -top-1 right-0 lg:-right-4 bg-white border border-emerald-100 rounded-xl p-2.5 shadow-lg items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
        <Check className="w-3 h-3 text-emerald-600" />
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-800">Payment Successful</div>
        <div className="text-[10px] text-slate-400">₹1,499 via UPI</div>
      </div>
    </div>

    {/* Floating method pill */}
    <div className="absolute -bottom-2 left-0 lg:-left-4 bg-white border border-[#7B4DB5]/20 rounded-full px-3 py-1.5 shadow-md flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[10px] font-semibold text-slate-700">160+ payment options</span>
    </div>
  </div>
);

/* ─── Platform logo placeholders ────────────────────────────────────────── */
const PLATFORMS = [
  { name: 'Shopify',         color: '#96BF48', initial: 'S' },
  { name: 'Wix',             color: '#0C6EFC', initial: 'W' },
  { name: 'Fynd',            color: '#E85A00', initial: 'F' },
  { name: 'Zoho',            color: '#E42527', initial: 'Z' },
  { name: 'Custom Website',  color: '#7B4DB5', initial: '{}'  },
];

/* ─── Why IndyPay benefits ──────────────────────────────────────────────── */
const BENEFITS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: 'Zero Coding Required',
    desc: 'Connect IndyPay to your store with a single plugin or embed code. No developers needed.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: 'Every Payment Method',
    desc: 'UPI, cards, net banking, EMI, BNPL, and wallets — your customers pay the way they prefer.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Mobile-First Checkout',
    desc: 'Checkout designed for thumbs. Optimised for every screen size — zero cart abandonment.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Go Live in Minutes',
    desc: 'Fast KYC, instant activation. Start accepting real payments within the same business day.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Industry-High Success Rate',
    desc: 'Smart routing ensures your customers never see a failed payment at checkout.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Bank-Grade Security',
    desc: 'PCI DSS Level 1 certified. Every transaction encrypted. Your customers trust you — we keep it that way.',
  },
];

/* ─── Features ──────────────────────────────────────────────────────────── */
const FEATURES = [
  { title: 'Smart Checkout',         desc: 'One-tap experience that remembers returning customers.' },
  { title: 'Real-Time Confirmation', desc: 'Instant payment status for both you and your customer.' },
  { title: 'EMI & Flexible Payments',desc: 'Let customers split payments — increase average order value.' },
  { title: 'Multi-Bank Support',     desc: 'Integrated with 150+ banks and financial institutions.' },
  { title: 'Scalable Infrastructure',desc: 'Built to handle spikes — flash sales, launch days, peak seasons.' },
  { title: 'Dashboard & Analytics',  desc: 'Real-time reports, settlement tracking, and business insights.' },
  { title: 'Webhook Notifications',  desc: 'Automate order fulfilment the moment payment lands.' },
  { title: '24×7 Support',           desc: 'Dedicated support team available whenever you need us.' },
];

/* ─── Use cases ─────────────────────────────────────────────────────────── */
const USE_CASES = [
  {
    emoji: '🛍️',
    title: 'E-Commerce Businesses',
    desc: 'Power your Shopify or Wix store with a checkout that converts. Accept orders from anywhere in India.',
  },
  {
    emoji: '🧑‍💼',
    title: 'Service Providers',
    desc: 'Salons, coaches, agencies — collect deposits, bookings, and session fees without chasing payments.',
  },
  {
    emoji: '💻',
    title: 'Freelancers',
    desc: 'Share a payment link or embed a checkout on your portfolio. Get paid for your work instantly.',
  },
  {
    emoji: '📦',
    title: 'Digital Product Sellers',
    desc: 'Sell courses, templates, or SaaS subscriptions. Automate delivery on successful payment.',
  },
];

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function NocodePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">

        {/* ════════════════════════════════════════════════════════════════
            §1 HERO
        ════════════════════════════════════════════════════════════════ */}
        <section className="relative pt-24 pb-16 sm:pb-20 bg-linear-to-br from-white via-[#f5f0fd] to-white overflow-hidden">
          {/* Ambient blob */}
          <div className="absolute top-0 right-0 w-96 lg:w-150 h-96 lg:h-150 rounded-full bg-[#7B4DB5]/8 blur-[120px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Copy */}
              <AnimatedDiv direction="left">
                <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-[#7B4DB5]/8 border border-[#7B4DB5]/20 text-[#7B4DB5] text-sm font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#7B4DB5] animate-pulse" />
                  No code. No developer. No delays.
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[2.85rem] font-black text-slate-900 leading-tight tracking-tight mb-5">
                  Accept Payments Instantly —<br />
                  <span className="text-[#7B4DB5]">Without Writing a Single Line of Code</span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                  Connect IndyPay to Shopify, Wix, Fynd, Zoho, or your own website in minutes. Smart checkout. Multiple payment modes. Live the same day.
                </p>

                <div className="flex flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-10">
                  <ContactCTAButton label="Get Started Free" variant="primary" className="text-base" />
                  <ContactCTAButton label="Talk to Sales" variant="secondary" className="text-base" />
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {['⚡ Go live in minutes', '🔒 Bank-grade security', '✅ Trusted by growing businesses'].map((t) => (
                    <span key={t} className="text-sm text-slate-500 font-medium">{t}</span>
                  ))}
                </div>
              </AnimatedDiv>

              {/* Three.js canvas */}
              <AnimatedDiv direction="right" delay={0.15} className="flex items-center justify-center">
                <div className="relative w-full max-w-sm sm:max-w-md h-72 sm:h-96 lg:h-115">
                  <NoCodeHeroCanvas />

                  {/* Floating stat cards — sit on top of canvas */}
                  <div className="absolute top-4 -left-2 sm:-left-6 bg-white rounded-xl border border-slate-100 shadow-lg p-2.5 sm:p-3 flex items-center gap-2 z-10">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-[10px] sm:text-xs font-bold text-slate-800">Live in minutes</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400">Same-day activation</div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 -right-2 sm:-right-6 bg-white rounded-xl border border-slate-100 shadow-lg p-2.5 sm:p-3 flex items-center gap-2 z-10">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#7B4DB5]/10 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7B4DB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] sm:text-xs font-bold text-slate-800">160+ Methods</div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400">UPI, Cards, EMI & more</div>
                    </div>
                  </div>
                </div>
              </AnimatedDiv>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            §2 PLATFORM COMPATIBILITY
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedDiv className="text-center mb-10 sm:mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">Integrations</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
                Works with your favourite platforms
              </h2>
              <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                Plug IndyPay into the tools you already use — no developer, no friction, no waiting.
              </p>
            </AnimatedDiv>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-5 mb-10 sm:mb-12">
              {PLATFORMS.map((p, i) => (
                <AnimatedDiv key={p.name} delay={i * 0.07} direction="scale">
                  <div className="flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 sm:px-8 py-4 sm:py-6 shadow-sm hover:shadow-md hover:border-[#7B4DB5]/30 transition-all group cursor-default">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white text-base sm:text-lg font-black shadow-sm"
                      style={{ background: p.color }}
                    >
                      {p.initial}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-[#7B4DB5] transition-colors">
                      {p.name}
                    </span>
                  </div>
                </AnimatedDiv>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { icon: '🔌', title: 'One-click plugins', desc: 'Install from the platform marketplace in under 60 seconds.' },
                { icon: '🧩', title: 'No-code & low-code', desc: 'Paste a snippet or use the visual builder — both work perfectly.' },
                { icon: '🔄', title: 'Flexible for any business', desc: 'D2C brands, agencies, SaaS products — IndyPay fits all shapes.' },
              ].map((item, i) => (
                <AnimatedDiv key={item.title} delay={i * 0.1} className="text-center">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </AnimatedDiv>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            §3 WHY INDYPAY
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedDiv className="text-center mb-12 sm:mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">Why IndyPay</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
                Built for businesses that want to grow, not debug
              </h2>
              <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                Everything you need to start accepting payments — nothing you don't.
              </p>
            </AnimatedDiv>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {BENEFITS.map((b, i) => (
                <AnimatedDiv key={b.title} delay={i * 0.07}>
                  <div className="group rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 hover:border-[#7B4DB5]/30 hover:shadow-lg hover:shadow-[#7B4DB5]/6 transition-all h-full">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#7B4DB5]/10 text-[#7B4DB5] flex items-center justify-center mb-4 group-hover:bg-[#7B4DB5] group-hover:text-white transition-all">
                      {b.icon}
                    </div>
                    <h3 className="text-base font-black text-slate-900 mb-2">{b.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                  </div>
                </AnimatedDiv>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            §4 PRODUCT EXPERIENCE
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-[#f9f5ff]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <AnimatedDiv direction="left" className="order-last lg:order-first flex items-center justify-center">
                <PaymentPhoneMockup />
              </AnimatedDiv>

              <AnimatedDiv direction="right">
                <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">Checkout Experience</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4 leading-tight">
                  A checkout your customers will love — every single time
                </h2>
                <p className="text-base text-slate-600 leading-relaxed mb-8">
                  IndyPay's checkout is built for speed and simplicity. Fewer taps, fewer drop-offs, more completed orders. Works beautifully on every device.
                </p>

                <div className="space-y-4">
                  {[
                    { title: 'Fast checkout', desc: 'Customers complete payment in under 30 seconds on average.' },
                    { title: 'Minimal steps', desc: 'Smart form fills and saved payment methods cut friction.' },
                    { title: 'Clear confirmation', desc: 'Instant success screen and notification — no second-guessing.' },
                    { title: 'Mobile-optimised UI', desc: 'Designed thumb-first. Flawless on Android and iOS.' },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-5 h-5 rounded-full bg-[#7B4DB5] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900">{item.title} </span>
                        <span className="text-sm text-slate-500">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </AnimatedDiv>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            §5 HOW IT WORKS
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedDiv className="text-center mb-12 sm:mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">Getting Started</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
                Three steps. That's it.
              </h2>
              <p className="text-base text-slate-500 max-w-md mx-auto leading-relaxed">
                No long onboarding. No complex setup. Start accepting payments faster than you'd expect.
              </p>
            </AnimatedDiv>

            <div className="grid sm:grid-cols-3 gap-8 relative">
              {/* Connector line (desktop) */}
              <div className="hidden sm:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 bg-linear-to-r from-[#7B4DB5]/20 via-[#7B4DB5]/50 to-[#7B4DB5]/20" />

              {[
                {
                  step: '01',
                  title: 'Connect your platform',
                  desc: 'Choose Shopify, Wix, Fynd, Zoho, or paste a snippet on your custom site. Done in under 2 minutes.',
                },
                {
                  step: '02',
                  title: 'Activate IndyPay',
                  desc: 'Complete quick KYC verification. Our team reviews and activates your account — same business day.',
                },
                {
                  step: '03',
                  title: 'Start accepting payments',
                  desc: "Your checkout is live. Watch the first payment come in. That's the whole setup.",
                },
              ].map((s, i) => (
                <AnimatedDiv key={s.step} delay={i * 0.15} className="flex flex-col items-center text-center">
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#7B4DB5] flex items-center justify-center mb-5 sm:mb-6 shadow-lg shadow-[#7B4DB5]/25">
                    <span className="text-xl sm:text-2xl font-black text-white">{s.step}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mb-3">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{s.desc}</p>
                </AnimatedDiv>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            §6 USE CASES
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedDiv className="text-center mb-10 sm:mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">Who It's For</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                IndyPay works for every type of business
              </h2>
            </AnimatedDiv>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {USE_CASES.map((u, i) => (
                <AnimatedDiv key={u.title} delay={i * 0.08}>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 hover:border-[#7B4DB5]/30 hover:shadow-md transition-all h-full">
                    <div className="text-3xl sm:text-4xl mb-4">{u.emoji}</div>
                    <h3 className="text-base font-black text-slate-900 mb-2">{u.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{u.desc}</p>
                  </div>
                </AnimatedDiv>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            §7 FEATURES
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedDiv className="text-center mb-12 sm:mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">Features</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
                Everything you need, nothing you don't
              </h2>
            </AnimatedDiv>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {FEATURES.map((f, i) => (
                <AnimatedDiv key={f.title} delay={i * 0.06}>
                  <div className="flex gap-3 p-4 sm:p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-[#7B4DB5]/25 hover:shadow-sm transition-all h-full">
                    <div className="w-5 h-5 rounded-full bg-[#7B4DB5] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 mb-0.5">{f.title}</div>
                      <div className="text-xs text-slate-500 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                </AnimatedDiv>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            §8 PRICING
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-[#f9f5ff]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedDiv className="text-center mb-12 sm:mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">Pricing</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
                Transparent pricing. No surprises.
              </h2>
              <p className="text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
                Pay only for successful transactions. No setup fees, no monthly minimums, no hidden charges.
              </p>
            </AnimatedDiv>

            <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 max-w-4xl mx-auto">
              {[
                {
                  name: 'Starter',
                  tag: 'For new businesses',
                  highlight: false,
                  perks: ['Standard payment methods', 'Basic dashboard', 'Email support', 'Instant activation'],
                },
                {
                  name: 'Growth',
                  tag: 'Most popular',
                  highlight: true,
                  perks: ['All payment methods', 'Advanced analytics', 'Priority support', 'EMI & BNPL enabled', 'Webhook integrations'],
                },
                {
                  name: 'Enterprise',
                  tag: 'For scale',
                  highlight: false,
                  perks: ['Custom pricing model', 'Dedicated account manager', 'SLA guarantee', 'White-label options', 'Custom integrations'],
                },
              ].map((plan, i) => (
                <AnimatedDiv key={plan.name} delay={i * 0.1} direction="scale">
                  <div
                    className={`rounded-2xl p-6 sm:p-8 border flex flex-col h-full ${
                      plan.highlight
                        ? 'bg-[#7B4DB5] border-[#7B4DB5] shadow-2xl shadow-[#7B4DB5]/30 sm:scale-105'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    {plan.highlight && (
                      <div className="inline-block mb-4 px-3 py-1 bg-white/20 rounded-full text-[11px] font-bold text-white uppercase tracking-wide w-fit">
                        Most Popular
                      </div>
                    )}
                    <h3 className={`text-xl font-black mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mb-6 ${plan.highlight ? 'text-white/70' : 'text-slate-400'}`}>{plan.tag}</p>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2.5">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.highlight ? 'bg-white/25' : 'bg-[#7B4DB5]/10'}`}>
                            <Check className={`w-2.5 h-2.5 ${plan.highlight ? 'text-white' : 'text-[#7B4DB5]'}`} />
                          </div>
                          <span className={`text-sm ${plan.highlight ? 'text-white/85' : 'text-slate-600'}`}>{perk}</span>
                        </li>
                      ))}
                    </ul>

                    <ContactCTAButton
                      label={plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started Free'}
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                        plan.highlight
                          ? 'bg-white text-[#7B4DB5] hover:bg-slate-50'
                          : 'bg-[#7B4DB5] text-white hover:bg-[#6A3BA0] shadow-md shadow-[#7B4DB5]/20'
                      }`}
                    />
                  </div>
                </AnimatedDiv>
              ))}
            </div>

            <p className="text-center text-sm text-slate-400 mt-8">
              All plans include zero setup fees and no monthly minimums. Custom plans available for high-volume businesses.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            §9 TRUST & SECURITY
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <AnimatedDiv direction="left">
                <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">Security</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-5 leading-tight">
                  Your business runs on trust. So does ours.
                </h2>
                <p className="text-base text-slate-600 leading-relaxed mb-8">
                  IndyPay is built on the same security standards trusted by India's leading banks. Every transaction is protected from end to end — so you can grow without worry.
                </p>

                <div className="space-y-3 sm:space-y-4">
                  {[
                    { icon: '🔒', title: 'PCI DSS Level 1 Certified', desc: 'The highest global standard for payment data security.' },
                    { icon: '🛡️', title: '256-bit AES Encryption', desc: 'Every transaction encrypted in transit and at rest.' },
                    { icon: '🔍', title: 'Real-Time Fraud Detection', desc: 'AI-powered monitoring catches suspicious activity before it reaches you.' },
                    { icon: '✅', title: 'RBI Compliant', desc: 'Fully compliant with Reserve Bank of India guidelines and regulations.' },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xl shrink-0">{item.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.title}</div>
                        <div className="text-sm text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </AnimatedDiv>

              {/* Trust badges */}
              <AnimatedDiv direction="right" delay={0.1}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { label: 'PCI DSS Level 1', sub: 'Certified' },
                    { label: '256-bit', sub: 'Encryption' },
                    { label: '99.99%', sub: 'Uptime SLA' },
                    { label: 'RBI', sub: 'Compliant' },
                    { label: '150+', sub: 'Banks Connected' },
                    { label: '24×7', sub: 'Monitoring' },
                  ].map((b) => (
                    <div
                      key={b.label}
                      className="flex flex-col items-center justify-center bg-linear-to-br from-[#f9f5ff] to-white border border-[#7B4DB5]/15 rounded-2xl p-4 sm:p-6 text-center hover:border-[#7B4DB5]/30 hover:shadow-md transition-all"
                    >
                      <div className="text-xl sm:text-2xl font-black text-[#7B4DB5]">{b.label}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">{b.sub}</div>
                    </div>
                  ))}
                </div>
              </AnimatedDiv>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            §10 FAQ
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-slate-50 border-y border-slate-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedDiv className="text-center mb-10 sm:mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Questions? We've got answers.
              </h2>
            </AnimatedDiv>
            <AnimatedDiv delay={0.1}>
              <FaqAccordion />
            </AnimatedDiv>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            §11 FINAL CTA
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-24 bg-[#7B4DB5] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-white/5 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

          <AnimatedDiv direction="scale" className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/15 text-white/90 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              50,000+ businesses already using IndyPay
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white mb-5 leading-tight">
              Start accepting payments today.<br />No code. No waiting.
            </h2>

            <p className="text-base text-white/70 mb-10 leading-relaxed">
              Join thousands of Indian businesses growing with IndyPay. Set up in minutes, go live the same day.
            </p>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <ContactCTAButton
                label="Get Started Free"
                className="px-8 sm:px-10 py-4 bg-white text-[#7B4DB5] text-base font-black rounded-xl hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-0.5"
              />
              <ContactCTAButton
                label="Contact Sales"
                className="px-8 sm:px-10 py-4 border-2 border-white/30 text-white text-base font-semibold rounded-xl hover:bg-white/10 hover:border-white/50 transition-all"
              />
            </div>

            <p className="mt-6 text-sm text-white/45">
              No credit card required · Free to start · Cancel anytime
            </p>
          </AnimatedDiv>
        </section>

      </main>
      <Footer />
    </>
  );
}
