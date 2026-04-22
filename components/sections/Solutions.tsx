const SOLUTIONS = [
  {
    tag: 'Online Payments',
    title: 'Payment Gateway',
    body: 'Accept payments online with our secure and reliable payment gateway. Support for all major payment methods including cards, UPI, wallets, and net banking.',
    cta: 'Learn More',
    color: 'from-[#3B5FD4] to-[#1E2A7A]',
  },
  {
    tag: 'Point of Sale',
    title: 'POS Solutions',
    body: 'Transform your physical store with smart POS terminals. Accept contactless payments, cards, and UPI with instant settlement and real-time reporting.',
    cta: 'Learn More',
    color: 'from-[#6BA3E8] to-[#3B5FD4]',
  },
  {
    tag: 'Recurring',
    title: 'Subscription Management',
    body: 'Automate recurring billing and subscription management. Handle trials, upgrades, downgrades, and cancellations with intelligent retry logic.',
    cta: 'Learn More',
    color: 'from-[#7B4DB5] to-[#3B5FD4]',
  },
  {
    tag: 'Payouts',
    title: 'Bulk Payouts',
    body: 'Send money to multiple beneficiaries instantly. Perfect for vendor payments, refunds, cashbacks, and salary disbursements with full compliance.',
    cta: 'Learn More',
    color: 'from-[#1E2A7A] to-[#7B4DB5]',
  },
  {
    tag: 'QR Code',
    title: 'Dynamic QR Payments',
    body: 'Generate dynamic QR codes for instant payments. Perfect for retail stores, restaurants, and service businesses with zero hardware cost.',
    cta: 'Learn More',
    color: 'from-[#3B5FD4] to-[#6BA3E8]',
  },
  {
    tag: 'Payment Links',
    title: 'Payment Links',
    body: 'Create and share payment links via SMS, email, or WhatsApp. No website needed - start accepting payments in minutes with zero integration.',
    cta: 'Learn More',
    color: 'from-[#6BA3E8] to-[#7B4DB5]',
  },
];

export default function Solutions() {
  return (
    <section id="solutions" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div data-aos="fade-up" className="text-center mb-16">
          <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">Our Solutions</p>
          <h2 className="text-4xl md:text-5xl font-black text-black mb-4">
            Complete Payment Solutions
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">
            Everything you need to accept, manage, and optimize payments for your business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SOLUTIONS.map((s, i) => (
            <div
              key={s.title}
              data-aos="fade-up"
              data-aos-delay={i * 80}
              className="group relative rounded-2xl border border-slate-100 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute top-0 inset-x-0 h-1 bg-linear-to-r ${s.color}`} />

              {/* Image Placeholder */}
              <div className="mb-5 aspect-video rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-slate-400 text-xs">Image Placeholder</p>
                </div>
              </div>

              <div className="mb-4">
                <span className={`text-xs font-bold uppercase tracking-wider text-[#7B4DB5]`}>
                  {s.tag}
                </span>
                <h3 className="text-black font-black text-xl leading-tight mt-1">{s.title}</h3>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">{s.body}</p>

              <a
                href="#"
                className="inline-flex items-center gap-1 text-[#7B4DB5] text-sm font-bold hover:gap-2 transition-all"
              >
                {s.cta}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
