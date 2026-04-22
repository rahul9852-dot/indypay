const PARTNERS = [
  'Partner 1', 'Partner 2', 'Partner 3', 'Partner 4', 'Partner 5',
  'Partner 6', 'Partner 7', 'Partner 8', 'Partner 9', 'Partner 10',
];

export default function TrustBar() {
  return (
    <section className="py-12 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm font-semibold text-slate-500 mb-8">
          Trusted by leading businesses and institutions
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
          {PARTNERS.slice(0, 5).map((p, i) => (
            <div
              key={i}
              data-aos="fade-up"
              data-aos-delay={i * 80}
              className="flex items-center justify-center"
            >
              {/* Logo Placeholder */}
              <div className="w-full aspect-[3/2] rounded-lg bg-gradient-to-br from-slate-100 to-white border border-slate-200 flex items-center justify-center hover:shadow-md transition-shadow">
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-slate-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-xs font-medium">{p}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
