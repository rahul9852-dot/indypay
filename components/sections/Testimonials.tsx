const TESTIMONIALS = [
  {
    quote: "IndyPay cut our fee reconciliation time from 3 days to 3 hours. The multi-bank settlement engine is a game-changer for our finance team.",
    name: "Priya Menon",
    role: "CFO, Brightstar Retail",
    initials: "PM",
    gradient: "from-[#3B5FD4] to-[#1E2A7A]",
  },
  {
    quote: "We process 40,000 student fee transactions every semester. IndyPay's uptime and instant UPI confirmation gave parents real peace of mind.",
    name: "Rajan Iyer",
    role: "Director of Finance, Apex Institute",
    initials: "RI",
    gradient: "from-[#6BA3E8] to-[#3B5FD4]",
  },
  {
    quote: "The embedded finance layer let us offer instant loans at checkout without building any lending infrastructure ourselves. Phenomenal product.",
    name: "Sneha Kulkarni",
    role: "CTO, QuickBasket",
    initials: "SK",
    gradient: "from-[#7B4DB5] to-[#3B5FD4]",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-[#0F1A4A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div data-aos="fade-up" className="text-center mb-16">
          <p className="text-[#6BA3E8] text-sm font-semibold tracking-widest uppercase mb-3">Customer Stories</p>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Loved by builders across India
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              data-aos="fade-up"
              data-aos-delay={i * 120}
              className="relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors"
            >
              <span className="absolute top-6 right-8 text-6xl text-white/10 font-serif leading-none">"</span>
              <p className="text-white/80 text-sm leading-relaxed mb-8 relative z-10">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-linear-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-slate-400 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
