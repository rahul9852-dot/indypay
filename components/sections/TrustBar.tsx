const PARTNERS = [
  'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI', 'Kotak Bank',
  'Yes Bank', 'IndusInd', 'Federal Bank', 'RBL Bank', 'NPCI',
];

export default function TrustBar() {
  return (
    <section className="py-10 bg-slate-50 border-y border-slate-100 overflow-hidden">
      <p className="text-center text-xs font-semibold tracking-widest text-slate-400 uppercase mb-6">
        Trusted by 500+ businesses · Powered by India's leading banks
      </p>
      <div className="flex gap-12 animate-marquee whitespace-nowrap">
        {[...PARTNERS, ...PARTNERS].map((p, i) => (
          <span key={i} className="inline-flex items-center text-sm font-bold text-slate-400 shrink-0">
            {p}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .animate-marquee { animation: marquee 20s linear infinite; }
      `}</style>
    </section>
  );
}
