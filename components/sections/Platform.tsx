const PILLARS = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: 'Open API Platform',
    body: 'RESTful APIs, SDKs for iOS, Android & Web, and webhook-based event streaming. Go live in under 2 days with our sandbox environment and 300+ code samples.',
    badges: ['REST API', 'SDK', 'Webhooks', 'Sandbox'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: 'Embedded Finance',
    body: 'Offer your customers credit, insurance, and investment products without a banking licence. Our BaaS layer plugs directly into your product UI.',
    badges: ['BaaS', 'White-label', 'Co-lending', 'KYC'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Financial Inclusion',
    body: 'Reach the next 400 million Indians with biometric-enabled micro-ATMs, Aadhaar Pay, and assisted-commerce tools — even in zero-connectivity zones.',
    badges: ['Aadhaar Pay', 'Micro-ATM', 'Offline Mode', 'Rural'],
  },
];

export default function Platform() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div data-aos="fade-up" className="text-center mb-16">
          <p className="text-[#3B5FD4] text-sm font-semibold tracking-widest uppercase mb-3">The Platform</p>
          <h2 className="text-4xl md:text-5xl font-black text-[#1E2A7A] mb-4">
            Infrastructure built to last
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Three foundational layers that give your business an unfair advantage.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              data-aos="fade-up"
              data-aos-delay={i * 120}
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 rounded-xl bg-linear-to-br from-[#3B5FD4]/15 to-[#7B4DB5]/15 text-[#3B5FD4] flex items-center justify-center mb-5">
                {p.icon}
              </div>
              <h3 className="text-[#1E2A7A] font-black text-xl mb-3">{p.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{p.body}</p>
              <div className="flex flex-wrap gap-2">
                {p.badges.map((b) => (
                  <span key={b} className="px-3 py-1 rounded-full bg-[#3B5FD4]/10 text-[#3B5FD4] text-xs font-semibold">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
