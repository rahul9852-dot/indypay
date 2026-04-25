import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function PayLaterPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        
        {/* Hero Section */}
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-black mb-6 leading-tight">
                  Offer EMI to Your Customers and Earn More Income (E.M.I.)
                </h1>

                <p className="text-base text-slate-700 mb-8 leading-snug">
                  Grow your business and increase your average ticket size by offering EMI as a payment option with IndyPay&apos;s Payment Gateway and POS solutions
                </p>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Request a DEMO
                </a>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl aspect-[3/2]">
                  <Image
                    src="/pay later/pay later.png"
                    alt="Pay Later"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Card EMI Details Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Illustration */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl aspect-[3/2]">
                  <Image
                    src="/pay later/EMI as a payment option.png"
                    alt="EMI as a payment option"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-black mb-6">
                  EMI as a payment option
                </h2>

                <p className="text-base text-slate-700 mb-8 leading-snug">
                  IndyPay&apos;s integrated EMI solution enables you to offer EMI payment options to your customers with a seamless experience
                </p>

                <h3 className="text-xl font-bold text-black mb-4">Key Features</h3>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Card EMI / Pay Later</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">No New Integration / Instant GO-LIVE for Existing Merchants</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Flexible EMI options</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Available on Payment Gateway and Point of Sale devices</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">20+ Bank and Pay Later Partners</span>
                  </li>
                </ul>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Request a DEMO
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Card EMI Details Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-black">Card EMI</h2>
                </div>

                <div className="pl-[60px]">
                  <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                    Enable your customers to convert their purchases into easy EMIs
                  </p>

                  <p className="text-base text-slate-700 mb-6 leading-snug">
                    Offer flexible EMI options on credit and debit cards to make high-value purchases affordable for your customers. Increase your sales by providing convenient payment plans.
                  </p>

                  <ul className="space-y-2 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Support for all major credit and debit cards</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Flexible tenure options from 3 to 24 months</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Instant approval and processing</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">No additional documentation required</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Seamless integration with your payment gateway</span>
                    </li>
                  </ul>

                  <a
                    href="#"
                    className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Get Started
                  </a>
                </div>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl aspect-[3/2]">
                  <Image
                    src="/pay later/Card EMI.png"
                    alt="Card EMI"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Consumer Loans Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl aspect-[3/2]">
                  <Image
                    src="/pay later/Consumer Loans.png"
                    alt="Consumer Loans"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h10M9 12h10M9 16h6m-3-8V6a2 2 0 012-2h2" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-black">Consumer Loans</h2>
                </div>

                <div className="pl-[60px]">
                  <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                    Grow your revenue without any risk by facilitating consumer loans through IndyPay
                  </p>

                  <p className="text-base text-slate-700 mb-6 leading-snug">
                    Instant Disbursement. Zero Documentation. Low Interest Rates. Collateral Free Loans up to 10 Lakh. Our Consumer Loans can help your customers to fulfil their short-term financial needs.
                  </p>

                  <ul className="space-y-2 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Instant approval with zero documentation - Know the customers eligibility in a few seconds by filling out a few details with no documents</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Loan Disbursement Amount - Offer collateral free loans of up to Rs. 10 Lakh without any working limits</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Multiple plans. Multiple Lenders - Get loans from lenders that specially fit your needs</span>
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
            </div>
          </div>
        </section>

        {/* Buy Now Pay Later Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-black">Buy Now Pay Later (BNPL)</h2>
                </div>

                <div className="pl-[60px]">
                  <p className="text-lg text-slate-800 mb-6 leading-snug font-semibold">
                    Offer flexible payment options to boost your sales
                  </p>

                  <p className="text-base text-slate-700 mb-6 leading-snug">
                    Enable your customers to buy now and pay later with our BNPL solution. Increase conversion rates and average order value by offering interest-free credit at checkout.
                  </p>

                  <ul className="space-y-2 mb-8">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Zero interest for customers on short-term plans</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Instant credit approval in seconds</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Flexible repayment options - Pay in 3, 6, or 12 installments</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">No risk to merchants - You get paid upfront</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-700">Easy integration with your existing checkout</span>
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
                <div className="relative w-full max-w-4xl aspect-[3/2]">
                  <Image
                    src="/pay later/Offer EMI.png"
                    alt="Offer EMI"
                    fill
                    className="object-contain"
                  />
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
