import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function BusinessDashboardPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        
        {/* Business Dashboard Section */}
        <section id="business-dashboard" className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-black">Business Dashboard</h1>
                </div>

                <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                  A unified Dashboard View along with all payment information
                </p>

                <p className="text-base text-slate-700 mb-8 leading-snug">
                  View data such as your Payments Volume, Transactions, and the distribution of your payments across payment methods (Cards, Netbanking, Wallets, etc.) and platforms (Android, Desktop), among other features. You can analyze this data by hours, days, weeks, or months over any period since your first transaction with IndyPay.
                </p>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Request demo
                </a>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto">
                  <div className="relative w-full aspect-[3/2]">
                    <Image
                      src="/Manage yout business/ Business Dashboard.png"
                      alt="Business Dashboard"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Khata Section */}
        <section id="business-khata" className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto">
                  <div className="relative w-full aspect-[3/2]">
                    <Image
                      src="/Manage yout business/Business Khata.png"
                      alt="Business Khata"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-black">Business Khata</h2>
                </div>

                <div className="pl-[60px]">
                  <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                    Simplify your business digitally with Khata Management
                  </p>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Convert all offline invoices to real-time online payments</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Automatically create invoices and send them out to the customers to collect online payments.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Track cash and card purchases, as well as customer udhaar details.</span>
                    </li>
                  </ul>

                  <a
                    href="#"
                    className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Request demo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Loans Section */}
        <section id="business-loans" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-2xl font-bold">₹</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-black">Business Loans</h2>
                </div>

                <div className="pl-[60px]">
                  <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                    Grow your business with easy and flexible Business Loans
                  </p>

                  <p className="text-base text-slate-700 mb-6 leading-snug">
                    You can quickly get credit for your business through our Banking and NBFC partners based on your transaction history
                  </p>

                  <p className="text-base text-slate-800 mb-4 leading-snug font-semibold">
                    Advantages of applying for this loan:
                  </p>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Digital loan with no bank visits and no paperwork</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Instant loan in two days</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Collateral Free loan</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Easy Loan Repayment Options</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Low-Interest Rate</span>
                    </li>
                  </ul>

                  <a
                    href="#"
                    className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Get it Now
                  </a>
                </div>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto">
                  <div className="relative w-full aspect-[3/2]">
                    <Image
                      src="/Manage yout business/Business Loans.png"
                      alt="Business Loans"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Insights Section */}
        <section id="business-insights" className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto">
                  <div className="relative w-full aspect-[3/2]">
                    <Image
                      src="/Manage yout business/Business Insights.png"
                      alt="Business Insights"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-black">Business Insights</h2>
                </div>

                <div className="pl-[60px]">
                  <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                    Prepare for your next business move.
                  </p>

                  <p className="text-base text-slate-700 mb-6 leading-snug">
                    The Business Insights Platform will process the relevant data sets and ask relevant questions to determine your next business move with precision.
                  </p>

                  <p className="text-base text-slate-700 mb-6 leading-snug">
                    Look into the resources listed below.
                  </p>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Payments Report</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Performance Insights</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Customer Experience</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Data Analytics</span>
                    </li>
                  </ul>

                  <a
                    href="#"
                    className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Request demo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Loyalty Section */}
        <section id="loyalty" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-black">Loyalty</h2>
                </div>

                <div className="pl-[60px]">
                  <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                    Engage your customers by giving them free rewards with every transaction.
                  </p>

                  <p className="text-base text-slate-700 mb-8 leading-snug">
                    Customers will return to take advantage of these incentives, resulting in increased sales and repeat purchases.
                  </p>

                  <a
                    href="#"
                    className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Request demo
                  </a>
                </div>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto">
                  <div className="relative w-full aspect-[3/2]">
                    <Image
                      src="/Manage yout business/Loyalty.png"
                      alt="Loyalty Program"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Risk and AML Section */}
        <section id="risk-aml" className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left - Image */}
                <div className="flex items-center justify-center">
                  <div className="relative w-full max-w-4xl mx-auto">
                    <div className="relative w-full aspect-[3/2]">
                      <Image
                        src="/Manage yout business/Risk and AML.png"
                        alt="Risk and AML"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Right - Content */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-black">Risk and AML</h2>
                  </div>

                  <div className="pl-[60px]">
                    <p className="text-base text-slate-700 mb-6 leading-snug">
                      Use the IndyPay Risk & AML solution to safeguard your organisation from financial crime by monitoring, detecting, alerting, minimising, and avoiding risk.
                    </p>

                    <p className="text-base text-slate-800 mb-4 leading-snug font-semibold">
                      Benefits:
                    </p>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-slate-700">Assists with meeting regulatory standards</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-slate-700">Enhances risk mitigation</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-slate-700">Optimises the compliance process</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-slate-700">Psychological profiling</span>
                      </li>
                    </ul>

                    <a
                      href="#"
                      className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                    >
                      Request demo
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reconciliation and Settlement Section */}
        <section id="reconciliation-settlement" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-slate-50 rounded-2xl p-12">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left - Content */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-black">Reconciliation and Settlement</h2>
                  </div>

                  <div className="pl-[60px]">
                    <p className="text-base text-slate-700 mb-6 leading-snug">
                      The Reconciliation & Settlements solution is an automated tool for increasing the accuracy of financial transaction processing across all channels (such as ATMs, POS, eCommerce, and Mobile Banking.)
                    </p>

                    <p className="text-base text-slate-800 mb-4 leading-snug font-semibold">
                      Benefits:
                    </p>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-slate-700">Time and manpower savings</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-slate-700">Increased Reliability and Productivity</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-slate-700">Quick resolution of mismatched transactions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-slate-700">One Solution for all reconciliation and settlement needs</span>
                      </li>
                    </ul>

                    <a
                      href="#"
                      className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                    >
                      Request demo
                    </a>
                  </div>
                </div>

                {/* Right - Image */}
                <div className="flex items-center justify-center">
                  <div className="relative w-full max-w-4xl mx-auto">
                    <div className="relative w-full aspect-[3/2]">
                      <Image
                        src="/Manage yout business/Reconciliation and Settlement.png"
                        alt="Reconciliation and Settlement"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
