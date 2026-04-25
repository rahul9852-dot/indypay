import HeroRibbonCanvas from "./HeroRibbonCanvas";
import ContactCTAButton from "@/components/ui/ContactCTAButton";

const BADGES = ['UPI', 'Cards', 'Net Banking', 'Wallets', 'EMI', 'BNPL'];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-white overflow-hidden">

      {/* ── Three.js ribbon background ──────────────────────── */}
      <HeroRibbonCanvas />

      {/* ── Very subtle bottom fade so page transition is clean */}
      <div
        className="absolute bottom-0 inset-x-0 h-32 pointer-events-none z-1"
        style={{ background: 'linear-gradient(to top, #ffffff, transparent)' }}
      />

      {/* ── Content — full width, sits over ribbon ──────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-32 md:py-40">

        {/* Stat pill */}
        <div
          data-aos="fade-up"
          className="mb-10 inline-flex items-center gap-2 text-sm"
        >
          <span className="font-semibold text-slate-800">Businesses growing on IndyPay:</span>
          <span className="font-bold text-[#7B4DB5]">50,000+</span>
          <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Display heading — full width, over the ribbon */}
        <h1
          data-aos="fade-up"
          data-aos-delay="80"
          className="font-display text-[2.6rem] sm:text-5xl md:text-6xl lg:text-[4.75rem] xl:text-[5.5rem] font-extrabold text-slate-900 leading-[1.04] tracking-tight mb-5"
          style={{ textShadow: '0 1px 24px rgba(255,255,255,0.5)' }}
        >
          Payment infrastructure<br />
          to grow your revenue.
        </h1>

        {/* Large muted subtitle — full width, purple tint */}
        <p
          data-aos="fade-up"
          data-aos-delay="160"
          className="font-display text-[1.45rem] sm:text-2xl md:text-[1.85rem] lg:text-[2.2rem] font-bold text-[#7B5CB8] leading-[1.22] tracking-tight mb-12"
          style={{ textShadow: '0 1px 18px rgba(255,255,255,0.55)' }}
        >
          Accept payments, offer financial services and implement<br className="hidden lg:block" />
          custom revenue models from your first transaction<br className="hidden lg:block" />
          to your billionth.
        </p>

        {/* CTAs */}
        <div
          data-aos="fade-up"
          data-aos-delay="240"
          className="flex flex-wrap items-center gap-4 mb-14"
        >
          <ContactCTAButton
            label="Get Started Free →"
            className="px-8 py-4 bg-[#7B4DB5] text-white text-base font-bold rounded-xl hover:bg-[#6A3BA0] transition-all shadow-xl shadow-[#7B4DB5]/30 hover:-translate-y-0.5"
          />
          <ContactCTAButton
            label="Talk to Sales"
            className="px-8 py-4 border-2 border-white/60 text-slate-800 text-base font-semibold rounded-xl hover:border-[#7B4DB5]/50 bg-white/50 backdrop-blur-md transition-all"
          />
        </div>

        {/* Payment method badges */}
        <div data-aos="fade-up" data-aos-delay="320" className="flex flex-wrap gap-2.5">
          {BADGES.map((b) => (
            <span
              key={b}
              className="px-4 py-2 rounded-lg bg-white/55 backdrop-blur-md border border-white/70 text-slate-700 text-sm font-semibold shadow-sm"
            >
              {b}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
