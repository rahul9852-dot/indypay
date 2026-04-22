import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MobileMockup } from "@/components/ui/DeviceMockup";

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

              {/* Right - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md aspect-[3/4] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Payment Interface Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with API payment interface image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* eNACH Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md aspect-[3/4] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">eNACH Dashboard Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with eNACH dashboard image</p>
                  </div>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-black">UPI Mandate & Intent</h2>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  Make UPI payments easy for your customers by activating UPI Intent on your application's payment screen. Take advantage of benefits such as increased conversion rates, reduced dropped carts, and reduced time required to complete the payment
                </p>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Get Started
                </a>
              </div>

              {/* Right - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md aspect-[3/4] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">UPI Payment Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with UPI payment image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EMI Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full aspect-[16/10] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">EMI Payment Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with EMI payment image</p>
                  </div>
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

        {/* Aadhaar Enabled Collections Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-black">Aadhaar Enabled Collections</h2>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  IndyPay enables your customers to use their Aadhaar credentials to perform basic financial transactions such as balance enquiries, cash withdrawals, and remittances. This service validates customer information using biometric identification and the Aadhaar card number
                </p>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Learn More
                </a>
              </div>

              {/* Right - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full aspect-[16/10] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Aadhaar Authentication Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with Aadhaar authentication image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customised Link-Based Solutions Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full aspect-[16/10] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Payment Link Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with payment link image</p>
                  </div>
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-black">Customised Link-Based Solutions</h2>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  Are you a small business owner? Are you losing customers due to a lack of digital payment options? Worry no more. With IndyPay's customised link-based solutions, easily accept payments through just a payment link and get paid instantly
                </p>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Create Payment Link
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

              {/* Right - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md aspect-[3/4] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Cash Collection Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with cash collection image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KYC and Penny Drop Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* KYC Validation */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-black">KYC Validation</h2>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  Validating a customer's KYC has never been easier, safer, or more efficient than now. Our suite of KYC services allow you to focus on your core business without worrying about regulatory compliance
                </p>

                <div className="w-full aspect-[16/10] rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-6">
                    <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="text-slate-400 text-sm font-semibold">KYC Validation Image</p>
                  </div>
                </div>
              </div>

              {/* Penny Drop Solution */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-black">Penny Drop Solution</h2>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  You can now authenticate a user's bank account using IndyPay's Penny Drop Solution which validates the account information by making a small deposit
                </p>

                <div className="w-full aspect-[16/10] rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-6">
                    <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-slate-400 text-sm font-semibold">Penny Drop Image</p>
                  </div>
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
