import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";


export default function GovernmentBusinessPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        
        {/* Hero Section with Form */}
        <section className="pt-20 pb-16 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-blue-600 mb-6 leading-tight">
                  Collect,
                  Manage &<br />
                  Grow with ease
                </h1>

                <p className="text-base text-slate-700 mb-8 leading-snug">
                  100% Digital Onboarding, Scalable APIs, Highest Success Rates and future-ready payment solutions - all-in-one platform
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">PCI-DSS Certified</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Trusted by 6+ Lakh Merchants</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">160+ Payment Options</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Dedicated Relationship Manager</span>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-4 uppercase tracking-wide font-semibold">Trusted by Industry Leaders</p>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="w-20 h-12 bg-slate-100 rounded flex items-center justify-center">
                      <span className="text-xs text-slate-400 font-semibold">Logo</span>
                    </div>
                    <div className="w-20 h-12 bg-slate-100 rounded flex items-center justify-center">
                      <span className="text-xs text-slate-400 font-semibold">Logo</span>
                    </div>
                    <div className="w-20 h-12 bg-slate-100 rounded flex items-center justify-center">
                      <span className="text-xs text-slate-400 font-semibold">Logo</span>
                    </div>
                    <div className="w-20 h-12 bg-slate-100 rounded flex items-center justify-center">
                      <span className="text-xs text-slate-400 font-semibold">Logo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Sign Up Form */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                <div className="mb-6">
                  <svg className="w-32 h-10 text-blue-600" viewBox="0 0 120 30" fill="currentColor">
                    <text x="0" y="22" fontSize="22" fontWeight="bold">IndyPay</text>
                  </svg>
                </div>

                <h2 className="text-2xl font-black text-black mb-2">
                  Let's Get You Verified
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  Please verify your mobile number to begin the signup process.
                </p>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Mobile Number<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select className="px-3 py-3 border border-slate-300 rounded-lg text-sm bg-white w-24">
                        <option>+91</option>
                        <option>+1</option>
                        <option>+44</option>
                      </select>
                      <input
                        type="tel"
                        placeholder="Enter Mobile Number"
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        className="px-6 py-3 bg-blue-100 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-200 transition-all"
                      >
                        Verify
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="terms" className="text-xs text-slate-600">
                      I have read and agree to the{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>{" "}
                      and the{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Terms & Conditions
                      </a>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-slate-200 text-slate-400 text-sm font-bold rounded-lg cursor-not-allowed"
                    disabled
                  >
                    Continue
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-black mb-4">
                Why Government Entities Choose IndyPay
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Secure, scalable, and compliant payment solutions designed for government operations
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Highest Security Standards</h3>
                <p className="text-sm text-slate-600">
                  PCI-DSS certified platform with bank-grade security for all transactions
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Scalable APIs</h3>
                <p className="text-sm text-slate-600">
                  Handle millions of transactions with our robust and scalable API infrastructure
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Compliance Ready</h3>
                <p className="text-sm text-slate-600">
                  Fully compliant with government regulations and data protection laws
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Real-time Reporting</h3>
                <p className="text-sm text-slate-600">
                  Comprehensive dashboards and reports for complete transaction visibility
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Multiple Payment Options</h3>
                <p className="text-sm text-slate-600">
                  Accept 160+ payment methods including cards, UPI, net banking, and wallets
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Dedicated Support</h3>
                <p className="text-sm text-slate-600">
                  24/7 dedicated relationship manager and technical support for your organization
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Transform Your Payment Operations?
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              Join 6+ lakh merchants who trust IndyPay for their payment needs
            </p>
            <a
              href="#"
              className="inline-block px-8 py-3 bg-white text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-50 transition-all"
            >
              Get Started Today
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
