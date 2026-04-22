import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PayoutsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        
        {/* Hero Section - Centered */}
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Dashboard Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-lg aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Payouts Dashboard Image Placeholder</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with dashboard screenshot</p>
                  </div>
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-black">Payouts</h1>
                </div>

                <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                  Complete financial management on a single platform
                </p>

                <p className="text-base text-slate-700 mb-6 leading-snug">
                  Our payout solution gives you a centralised dashboard to manage all payouts
                </p>

                <p className="text-base text-slate-800 mb-4 leading-snug font-semibold">
                  How does it work?
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">With a single click, you can authorise multiple payouts such as vendor invoices, employee salaries, and customer payouts from any location</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Raise, Approve and Authorise Purchase Orders and Invoices</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Businesses can upload and pay invoices in bulk</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">You will have complete control with user access management and maker/checker capabilities</span>
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
        </section>

        {/* Utility Bill Payments Section */}
        <section id="utility-bill-payments" className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-black">Utility Bill Payments</h2>
                </div>

                <div className="pl-[60px]">
                  <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                    No Convenience Fee on Utility Bill Payments
                  </p>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">You can pay for various bill payment and recharges (DTH, mobile, etc.)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">You can pay all utility bills across geographies with a single click using any payment instrument</span>
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
                <div className="w-full max-w-lg aspect-[3/4] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Utility Bills Mobile Image Placeholder</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with mobile app screenshot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section id="cards" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-black">Cards</h2>
              </div>

              <p className="text-base text-slate-700 max-w-3xl mx-auto mb-8 leading-snug">
                Introducing #MadeInIndia IndyPay prepaid cards. You can open this hassle-free account in less than 5 minutes to make purchases from your Lifetime Zero Balance Wallet
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <p className="text-base text-slate-700 mb-6 leading-snug">
                  Gift this pre-loaded card to a loved one on a special occasion or utilise it for your benefit. It's all up to you!
                </p>

                <p className="text-base text-slate-700 mb-6 leading-snug">
                  Let's look at the benefits of this card, which can be used, both in stores and online
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Pay all your bills and recharge your phone with a single click</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Make payments with your wallet and choose the best loan product for your needs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Find, compare, and purchase insurance products that will provide you peace of mind while also assisting you and your loved ones in preparing for life's uncertainties</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Set transaction limits or even disable certain types of transactions to gain control over your finances</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Choose the best wallet and get exciting benefits and rewards</span>
                  </li>
                </ul>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Get it Now
                </a>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-lg aspect-[3/4] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Cards Mobile Image Placeholder</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with mobile app screenshot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Employee Expense Management Section */}
        <section id="expense-management" className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-lg aspect-[3/4] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Expense Management Mobile Image Placeholder</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with mobile app screenshot</p>
                  </div>
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-black">Employee Expense Management</h2>
                </div>

                <div className="pl-[60px]">
                  <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                    Are your employees submitting an excessive number of reimbursement receipts?
                  </p>

                  <p className="text-base text-slate-700 mb-6 leading-snug">
                    Simplify employee expense management by providing better visibility into spending and expense categories
                  </p>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Our expense management solutions make it easier to track an employee's expenses and reimbursements</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">The platform provides comprehensive insight on employee expenditure and expense heads to both the employee and your corporate office</span>
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

        {/* Tax Management Section */}
        <section id="tax-management" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-black">Tax Management</h2>
                </div>

                <div className="pl-[60px]">
                  <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                    Tax Management for SMEs
                  </p>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">A single interface for paying your state and Central Government taxes.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">100% safe and secure</span>
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
                <div className="w-full max-w-lg aspect-[3/4] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Tax Management Mobile Image Placeholder</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with mobile app screenshot</p>
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
