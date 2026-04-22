const INDUSTRIES = [
  {
    icon: "🎓",
    title: "Education",
    subtitle: "Does your institute struggle with fee collection?",
    description: "schoolpay - a secure, end-to-end cashless payment solution for institutions and parents",
    details: "Enabling seamless transactions from a single platform while maintaining the highest levels of security.",
  },
  {
    icon: "🏨",
    title: "Hospitality",
    subtitle: "Do you want to improve your customer experience?",
    description: "Enriching Payment Experiences for Hotels & Restaurants",
    details: "Our Payments product suite is designed to provide a seamless payment experience for your customers",
  },
  {
    icon: "🛒",
    title: "Retail",
    subtitle: "Are your customers demanding more ways to pay?",
    description: "Now get quick and hassle-free digital payments for your Retail Outlet",
    details: "It is a fantastic match! Both you and IndyPay offer an omnichannel experience.",
  },
  {
    icon: "🏦",
    title: "BFSI",
    subtitle: "Need to Collect Payments for your Banking Institution?",
    description: "Complete payment solutions for financial institutions",
    details: "You have feet on the ground, a call centre, and a website for collecting payments. Our omnichannel payment solutions – PoS, ePoS, and SMS payment link – bring all of this together under one roof",
  },
  {
    icon: "🏦",
    title: "Financial Institutions",
    subtitle: "Customers are demanding better service!",
    description: "They want to transact outside of your bank branch, and IndyPay Human ATM is the solution",
    details: "Extend digital banking services at zero capital investment through a portable biometric android device",
  },
  {
    icon: "🚚",
    title: "Logistics",
    subtitle: "You manage logistics, and we handle payment logistics for you",
    description: "Whether it is customers who pay you for services or you are paying vendors. We have the most efficient solution to be delivered to you",
    details: "",
  },
];

export default function Industries() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 space-y-20">
        {INDUSTRIES.map((industry, i) => (
          <div
            key={industry.title}
            data-aos="fade-up"
            data-aos-delay={i * 100}
          >
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Side - Content */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
                    {industry.icon}
                  </div>
                  <h3 className="text-2xl font-black text-black">{industry.title}</h3>
                </div>

                <p className="text-base font-normal text-slate-700 mb-4">{industry.subtitle}</p>
                <p className="text-base font-normal text-slate-700 mb-6 leading-relaxed">{industry.description}</p>
                {industry.details && (
                  <p className="text-sm text-slate-600 mb-8 font-normal leading-relaxed">{industry.details}</p>
                )}

                <a
                  href="#"
                  className="inline-block px-7 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Know More
                </a>
              </div>

              {/* Right Side - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">{industry.title} Image Placeholder</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with your image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
