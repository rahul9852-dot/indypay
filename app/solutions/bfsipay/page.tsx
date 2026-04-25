import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MobileMockup } from "@/components/ui/DeviceMockup";
import Image from "next/image";

export default function BFSIPayPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        
        {/* Hero Section */}
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-3xl md:text-4xl font-black text-black text-center mb-16">
              BFSI Payments Solutions by IndyPay
            </h1>

            {/* APIs and SDKs Section */}
            <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-black">APIs and SDKs</h2>
                </div>

                <p className="text-base text-slate-700 leading-snug">
                  Our API and SDK (web, mobile, iFrame, inline) integrations enable you to create a dynamic and responsive payment interface for your mobile applications and websites. The IndyPay platform provides your users with a quick, safe, and simple payment experience through Wallets, Debit/Credit Cards, Net Banking, UPI, and EMI
                </p>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/bfsipay/APIs and SDKs.png"
                    alt="APIs and SDKs"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* eNACH Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/bfsipay/eNACH.png"
                    alt="eNACH"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-black">eNACH</h2>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  eNACH and E-Mandate make it easy for businesses and their customers to manage recurring payments such as telephone bills, insurance premiums, utility bills, SIPs, and school fees. Rather than manually tracking and making monthly premium payments, the customer can plan all premium payments online at the start of the premium payment term
                </p>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* UPI Mandate & Intent Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-black">UPI Mandate & Intent</h2>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  Make UPI payments easy for your customers by activating UPI Intent on your application's payment screen. Take advantage of benefits such as:
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700">Increased conversion rates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700">Reduced dropped carts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700">Reduced time required to complete the payment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700">Seamless one-click payment experience</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700">Enhanced customer satisfaction and trust</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700">Support for recurring payments and mandates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700">Real-time payment confirmation</span>
                  </li>
                </ul>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Get Started
                </a>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/bfsipay/UPI Mandate & Intent.png"
                    alt="UPI Mandate & Intent"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EMI Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/bfsipay/EMI.png"
                    alt="EMI"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-black">EMI</h2>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  The customer can pay for the transaction in full or as EMIs, based on the payment conditions set by the card provider. IndyPay supports EMIs on Debit and Credit Card
                </p>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Explore EMI Options
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Cash Collection Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-black">Cash Collection</h2>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  Through its PoS and ePoS solutions, IndyPay's cash collection service is available at over 5 lakh IndyPay vyaapaar merchant locations. The IndyPay platform enhances business processes and significantly improves an NBFC client's Cash EMI collection timelines
                </p>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Explore Cash Collection
                </a>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/bfsipay/Cash Collection.png"
                    alt="Cash Collection"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <a
              href="#"
              className="inline-block px-10 py-4 bg-blue-600 text-white text-base font-bold rounded-lg hover:bg-blue-700 transition-all"
            >
              Request demo
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
