const SOLUTIONS = [
  {
    icon: '🎓',
    tag: 'Education',
    title: 'SchoolPay — Cashless Campus Payments',
    body: 'Streamline tuition, hostel, and canteen fee collection across institutions. Automated receipts, real-time reconciliation, and parent-friendly UPI links that reduce admin overhead by 80%.',
    cta: 'Explore EduPay',
    color: 'from-[#3B5FD4] to-[#1E2A7A]',
  },
  {
    icon: '🛒',
    tag: 'Retail',
    title: 'OmniPay — In-store & Online Unified',
    body: 'Give your customers one seamless checkout experience whether they shop in your store or on your app. Tap-to-pay, QR, card swipe, and BNPL — all reconciled in one dashboard.',
    cta: 'Explore RetailPay',
    color: 'from-[#6BA3E8] to-[#3B5FD4]',
  },
  {
    icon: '🏨',
    tag: 'Hospitality',
    title: 'HotelPay — Frictionless Guest Checkout',
    body: 'From pre-arrival deposits to dining, spa, and late checkout — IndyPay embeds into your PMS so every touchpoint is a revenue opportunity, never a friction point.',
    cta: 'Explore HotelPay',
    color: 'from-[#7B4DB5] to-[#3B5FD4]',
  },
  {
    icon: '🏦',
    tag: 'BFSI',
    title: 'LenderPay — Collections & Disbursals',
    body: 'Automate EMI collection, loan disbursals, and insurance premium payments across 22 banking partners. API-first, RBI-compliant, and built for massive scale.',
    cta: 'Explore LenderPay',
    color: 'from-[#1E2A7A] to-[#7B4DB5]',
  },
  {
    icon: '🚚',
    tag: 'Logistics',
    title: 'FleetPay — COD & Vendor Settlements',
    body: 'Collect cash-on-delivery digitally, pay delivery partners instantly via UPI, and settle vendor invoices in bulk — all from one operations console.',
    cta: 'Explore FleetPay',
    color: 'from-[#3B5FD4] to-[#6BA3E8]',
  },
  {
    icon: '🏥',
    tag: 'Healthcare',
    title: 'MediPay — Patient-First Billing',
    body: 'Enable insurance pre-auth, OPD payments, and pharmacy billing under one roof. Integrate with HMS systems for zero-friction patient discharge and claims processing.',
    cta: 'Explore MediPay',
    color: 'from-[#6BA3E8] to-[#7B4DB5]',
  },
];

export default function Solutions() {
  return (
    <section id="solutions" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div data-aos="fade-up" className="text-center mb-16">
          <p className="text-[#3B5FD4] text-sm font-semibold tracking-widest uppercase mb-3">Industry Solutions</p>
          <h2 className="text-4xl md:text-5xl font-black text-[#1E2A7A] mb-4">
            Built for every vertical
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Purpose-built payment stacks for the industries that power India's economy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SOLUTIONS.map((s, i) => (
            <div
              key={s.title}
              data-aos="fade-up"
              data-aos-delay={i * 80}
              className="group relative rounded-2xl border border-slate-100 bg-slate-50 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute top-0 inset-x-0 h-1 bg-linear-to-r ${s.color}`} />

              <div className="flex items-start gap-4 mb-4">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider bg-linear-to-r ${s.color} bg-clip-text text-transparent`}>
                    {s.tag}
                  </span>
                  <h3 className="text-[#1E2A7A] font-black text-lg leading-tight mt-0.5">{s.title}</h3>
                </div>
              </div>

              <p className="text-slate-500 text-sm leading-relaxed mb-6">{s.body}</p>

              <a
                href="#"
                className="inline-flex items-center gap-1 text-[#3B5FD4] text-sm font-semibold hover:gap-2 transition-all"
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
