import CountUpNumber from '@/components/ui/CountUpNumber';

const STATS = [
  { end: 22,   suffix: '+',  label: 'Banking Partners',       desc: 'Direct integrations with top Indian banks' },
  { end: 500,  suffix: 'K+', label: 'Active Merchants',       desc: 'Businesses scaling with IndyPay daily' },
  { end: 99.9, suffix: '%',  decimals: 1, label: 'Uptime SLA',desc: 'Enterprise-grade reliability guaranteed' },
  { end: 2,    suffix: 'B+', label: 'Transactions Processed', desc: 'And counting, every single month' },
];

export default function Stats() {
  return (
    <section className="py-24 bg-[#0F1A4A]">
      <div className="max-w-6xl mx-auto px-6">
        <div data-aos="fade-up" className="text-center mb-16">
          <p className="text-[#6BA3E8] text-sm font-semibold tracking-widest uppercase mb-3">By the numbers</p>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            The scale that speaks for itself
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="text-4xl md:text-5xl font-black text-[#7B4DB5] mb-2">
                <CountUpNumber end={s.end} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <p className="text-white font-bold text-sm mb-1">{s.label}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
