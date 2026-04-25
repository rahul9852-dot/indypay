const COMPANIES = [
  { name: 'Nova Enterprises',  symbol: '★' },
  { name: 'Shopify',           symbol: '◈' },
  { name: 'Zoho',              symbol: '◉' },
  { name: 'Webinfinity',       symbol: '⬡' },
  { name: 'Fresh Quality',     symbol: '◆' },
  { name: 'MetLife',           symbol: '◎' },
  { name: 'Ramp',              symbol: '↗' },
  { name: 'Figma',             symbol: '◐' },
  { name: 'Vercel',            symbol: '▲' },
  { name: 'Mindbody',          symbol: '◑' },
];

/* Duplicate for seamless loop */
const ITEMS = [...COMPANIES, ...COMPANIES];

export default function TrustedMarquee() {
  return (
    <div className="relative bg-white border-y border-slate-100 overflow-hidden py-5">
      {/* Left fade */}
      <div className="absolute inset-y-0 left-0 w-24 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute inset-y-0 right-0 w-24 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />

      {/* Scrolling track */}
      <div className="flex gap-0" style={{ animation: 'marquee 32s linear infinite' }}>
        {ITEMS.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 shrink-0 px-10"
          >
            <span className="text-[#7B4DB5]/40 text-lg leading-none">{c.symbol}</span>
            <span className="text-slate-500 text-base font-semibold tracking-tight whitespace-nowrap">
              {c.name}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
