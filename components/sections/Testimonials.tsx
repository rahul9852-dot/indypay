const TESTIMONIALS = [
  {
    quote: "Switching to this payment gateway was the best decision for our business. The integration was seamless and support team is always responsive.",
    name: "Rajesh Kumar",
    role: "Founder, TechStore India",
    initials: "RK",
    gradient: "from-[#3B5FD4] to-[#1E2A7A]",
  },
  {
    quote: "We've seen a 40% increase in successful transactions since moving to this platform. The checkout experience is smooth and customers love it.",
    name: "Anita Sharma",
    role: "CEO, Fashion Hub",
    initials: "AS",
    gradient: "from-[#6BA3E8] to-[#3B5FD4]",
  },
  {
    quote: "Outstanding service and reliability. The real-time analytics help us make better business decisions. Highly recommend for any growing business.",
    name: "Vikram Patel",
    role: "Director, Global Exports",
    initials: "VP",
    gradient: "from-[#7B4DB5] to-[#3B5FD4]",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div data-aos="fade-up" className="text-center mb-16">
          <p className="text-[#7B4DB5] text-5xl md:text-6xl font-bold tracking-widest uppercase mb-3">Testimonials</p>
          <h2 className="text-xl md:text-2xl font-black text-black">
            Trusted by businesses nationwide
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              data-aos="fade-up"
              data-aos-delay={i * 120}
              className="relative bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all"
            >
              <span className="absolute top-6 right-8 text-6xl text-slate-200 font-serif leading-none">"</span>
              <p className="text-slate-700 text-sm leading-relaxed mb-8 relative z-10 font-medium">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-[#7B4DB5] flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-black font-bold text-sm">{t.name}</p>
                  <p className="text-slate-600 text-xs font-medium">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
