export default function CTA() {
  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div
          data-aos="zoom-in"
          className="relative rounded-3xl bg-[#0F1A4A] px-8 py-16 overflow-hidden"
        >
          {/* Glow orbs — logo colours */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#3B5FD4]/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#7B4DB5]/25 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-[#6BA3E8]/10 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <p className="text-[#6BA3E8] text-sm font-semibold tracking-widest uppercase mb-4">Get Started Today</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
              Ready to power your <br className="hidden md:block" />
              payments with IndyPay?
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Join 500,000+ businesses across India. No setup fees, no lock-in contracts —
              just powerful payments from day one.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#"
                className="px-8 py-4 bg-[#7B4DB5] text-white text-base font-bold rounded-xl hover:bg-[#6A3BA0] transition-all shadow-xl shadow-purple-500/30"
              >
                Create Free Account →
              </a>
              <a
                href="#"
                className="px-8 py-4 border-2 border-white/20 text-white text-base font-semibold rounded-xl hover:bg-white/10 transition-all"
              >
                Talk to Sales
              </a>
            </div>

            <p className="mt-6 text-slate-500 text-xs">
              No credit card required · RBI regulated · SOC 2 certified
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
