import SectionHeader from '@/components/ui/SectionHeader';

const PILLARS = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Bank-Grade Security',
    body: 'PCI-DSS Level 1 certified infrastructure with end-to-end encryption, tokenization, and fraud detection powered by machine learning algorithms.',
    badges: ['PCI-DSS', '256-bit SSL', 'Tokenization', '3D Secure'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Lightning Fast',
    body: '99.99% uptime with sub-second response times. Our distributed architecture handles millions of transactions per day without breaking a sweat.',
    badges: ['99.99% Uptime', 'Auto-scaling', 'CDN', 'Load Balanced'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Smart Analytics',
    body: 'Real-time dashboards with actionable insights. Track success rates, identify drop-offs, and optimize your payment flow with data-driven decisions.',
    badges: ['Real-time', 'Custom Reports', 'Webhooks', 'API Access'],
  },
];

export default function Platform() {
  return (
    <section className="py-8 bg-slate-50">
      <div className="max-w-7xl mx-auto px-16">
        <SectionHeader
          label="Why Choose Us"
          title="Built for scale and reliability"
          description="Enterprise-grade infrastructure trusted by thousands of businesses across India."
        />

        <div className="grid md:grid-cols-3 gap-8">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              data-aos="fade-up"
              data-aos-delay={i * 120}
              className="bg-white rounded-2xl p-8 border border-slate-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#7B4DB5] flex items-center justify-center mb-6">
                {p.icon}
              </div>
              <h3 className="text-black font-black text-xl mb-4">{p.title}</h3>
              <p className="text-slate-600 text-base leading-relaxed mb-6 font-normal">{p.body}</p>
              <div className="flex flex-wrap gap-2">
                {p.badges.map((b) => (
                  <span key={b} className="px-3 py-1.5 rounded-md bg-purple-50 text-[#7B4DB5] text-xs font-semibold">
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
