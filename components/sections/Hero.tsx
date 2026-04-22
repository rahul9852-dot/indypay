const BADGES = ['UPI', 'Cards', 'Net Banking', 'Wallets', 'EMI', 'BNPL'];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-2 bg-white ">
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div
              data-aos="fade-right"
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-[#7B4DB5] animate-pulse" />
              Trusted by 50,000+ Businesses
            </div>

            <h1
              data-aos="fade-right"
              data-aos-delay="100"
              className="text-2xl md:text-4xl lg:text-5xl font-black text-black leading-tight tracking-tight mb-6"
            >
              Accept Payments Anywhere,
              Anytime
            </h1>

            <p
              data-aos="fade-right"
              data-aos-delay="200"
              className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed"
            >
              Complete payment solution for your business. Accept online payments, manage subscriptions, and grow your revenue with our secure payment gateway.
            </p>

            <div data-aos="fade-right" data-aos-delay="300" className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href="#contact"
                className="px-8 py-4 bg-[#7B4DB5] text-white text-base font-bold rounded-lg hover:bg-[#6A3BA0] transition-all shadow-lg text-center"
              >
                Get Started Free
              </a>
              <a
                href="#demo"
                className="px-8 py-4 border-2 border-slate-300 text-black text-base font-semibold rounded-lg hover:bg-slate-50 transition-all text-center"
              >
                Schedule Demo
              </a>
            </div>

            <div data-aos="fade-right" data-aos-delay="400" className="flex flex-wrap gap-3">
              {BADGES.map((b) => (
                <span
                  key={b}
                  className="px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Right - Hero Image Placeholder */}
          <div data-aos="fade-left" data-aos-delay="200" className="relative">
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Placeholder for hero image */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-slate-200 flex items-center justify-center">
                    <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm font-semibold">Hero Image Placeholder</p>
                  <p className="text-slate-400 text-xs mt-2">Replace with your image</p>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-[#7B4DB5]/10 border border-[#7B4DB5]/20" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl bg-[#7B4DB5]/10 border border-[#7B4DB5]/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 text-xs animate-bounce">
        <span>scroll</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
