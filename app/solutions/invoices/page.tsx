import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function InvoicesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-blue-600 leading-tight">Invoicepay</h1>
              </div>
              
              <p className="text-base text-slate-700 mb-4 leading-snug">
                Difficulty in managing invoices? Are you facing problems in accepting digital payments?
              </p>
              
              <p className="text-base text-slate-700 mb-8 leading-snug">
                With IndyPay&apos;s invoicepay solution, you can accept payments with a simple payment link and get paid faster for your invoices.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Quick Payment Links</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Secure Digital Payments</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Real-time Tracking</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Multiple Payment Methods</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-4 uppercase tracking-wide font-semibold">Trusted by Businesses</p>
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
            
            {/* Right - Invoice Preview */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
              <div className="mb-6">
                <svg className="w-32 h-10 text-blue-600" viewBox="0 0 120 30" fill="currentColor">
                  <text x="0" y="22" fontSize="22" fontWeight="bold">IndyPay</text>
                </svg>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">₹ 88,480.00</div>
                    <div className="text-gray-600 mb-4">Invoice Amount</div>
                    <div className="space-y-3 text-left text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Invoice No:</span>
                        <span className="font-medium">#INV-001</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium">15 Dec 2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-orange-600">Pending</span>
                      </div>
                    </div>
                    <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold mt-6 hover:bg-green-700 transition-colors">
                      PAY NOW
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-black mb-4">
              Your Challenges & Our Solutions
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Transform your invoice management with contactless digital payments
            </p>
          </div>

          {/* Challenge 1: Physical Payment Collection */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Image Placeholder */}
            <div className="bg-slate-100 rounded-2xl aspect-[4/3] flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 font-medium">Image Placeholder</p>
                <p className="text-xs text-slate-400 mt-1">Physical Payment Collection</p>
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="mb-8">
                <div className="bg-slate-200 rounded-r-lg px-6 py-2 inline-block mb-4">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wide">YOUR CHALLENGES</h4>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Physical Payment Collection
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 shrink-0"></div>
                    <span className="text-slate-700">Be COVID-19 safe and follow government regulations.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 shrink-0"></div>
                    <span className="text-slate-700">Physical interaction with Customers for payment collection.</span>
                  </li>
                </ul>
              </div>

              <div>
                <div className="bg-yellow-400 rounded-r-lg px-6 py-2 inline-block mb-4">
                  <h4 className="font-bold text-yellow-900 uppercase tracking-wide">SOLUTIONS</h4>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Go Contactless - The new normal
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">Online payment - easy & safe, avoid multiple touchpoints.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">Customers pay online through any digital payment method.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Challenge 2: Efficiency in Administrative tasks */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Content */}
            <div className="order-2 lg:order-1">
              <div className="mb-8">
                <div className="bg-slate-200 rounded-r-lg px-6 py-2 inline-block mb-4">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wide">YOUR CHALLENGES</h4>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Efficiency in Administrative tasks
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 shrink-0"></div>
                    <span className="text-slate-700">Human Errors & Delay in reconciliation of bills.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 shrink-0"></div>
                    <span className="text-slate-700">Lots of paperwork involved - Hassle for staff to process.</span>
                  </li>
                </ul>
              </div>

              <div>
                <div className="bg-yellow-400 rounded-r-lg px-6 py-2 inline-block mb-4">
                  <h4 className="font-bold text-yellow-900 uppercase tracking-wide">SOLUTIONS</h4>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Enabling Digitalization
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">Easy integration with existing system for real time reconciliation.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">Go Green & Paperless - Avoid multiple invoices for multiple procedures.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Image Placeholder */}
            <div className="bg-slate-100 rounded-2xl aspect-[4/3] flex items-center justify-center order-1 lg:order-2">
              <div className="text-center">
                <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 font-medium">Image Placeholder</p>
                <p className="text-xs text-slate-400 mt-1">Administrative Efficiency</p>
              </div>
            </div>
          </div>

          {/* Challenge 3: Omni-Channel Payment Acceptance */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image Placeholder */}
            <div className="bg-slate-100 rounded-2xl aspect-[4/3] flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 font-medium">Image Placeholder</p>
                <p className="text-xs text-slate-400 mt-1">Omni-Channel Payments</p>
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="mb-8">
                <div className="bg-slate-200 rounded-r-lg px-6 py-2 inline-block mb-4">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wide">YOUR CHALLENGES</h4>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Omni-Channel Payment Acceptance
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 shrink-0"></div>
                    <span className="text-slate-700">Multi-channel payment acceptance and reconciliation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-900 rounded-full mt-2 shrink-0"></div>
                    <span className="text-slate-700">Hassle for Finance & Accounts team to provide updated information on overdue bills.</span>
                  </li>
                </ul>
              </div>

              <div>
                <div className="bg-yellow-400 rounded-r-lg px-6 py-2 inline-block mb-4">
                  <h4 className="font-bold text-yellow-900 uppercase tracking-wide">SOLUTIONS</h4>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Spoil your customers with choices
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">Options to choose from debit cards to credit cards, internet banking to UPI from 45+ partner banks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">360° View of all operations across multiple locations.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Streamline Your Invoice Management?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of businesses who trust Invoicepay for faster, secure invoice payments
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