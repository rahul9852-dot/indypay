import CountUpNumber from '@/components/ui/CountUpNumber';

const STATS = [
  { end: 50,   suffix: 'K+',  label: 'Active Merchants',       desc: 'Businesses trust our platform' },
  { end: 100,  suffix: 'M+', label: 'Transactions',       desc: 'Processed successfully every month' },
  { end: 99.9, suffix: '%',  decimals: 1, label: 'Uptime',desc: 'Guaranteed reliability' },
  { end: 24,    suffix: '/7', label: 'Support', desc: 'Always here to help you' },
];

export default function Stats() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div data-aos="fade-up" className="text-center mb-16">
          <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">Our Impact</p>
          <h2 className="text-4xl md:text-5xl font-black text-black">
            Numbers that matter
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-lg transition-all"
            >
              <div className="text-4xl md:text-5xl font-black text-[#7B4DB5] mb-2">
                <CountUpNumber end={s.end} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <p className="text-black font-bold text-sm mb-1">{s.label}</p>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
