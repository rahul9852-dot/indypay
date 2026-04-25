import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MobileMockup, MobileLandscapeMockup } from "@/components/ui/DeviceMockup";
import Image from "next/image";

export default function HotelPayPage() {
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-black">Enriching Payment Experiences for Hotels & Restaurants</h1>
                </div>

                <p className="text-base text-slate-700 mb-4 leading-snug">
                  Are you a restaurant or a hotel, or a hotel chain, we are here to help. With hotelpay, enhance your customer experience by helping your customers pay quickly and effortlessly.
                </p>

                <p className="text-base text-slate-700 mb-8 leading-snug">
                  hotelpay, is specially designed to solve problems of the hospitality sector as a whole.
                </p>

                <a
                  href="#"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Get Started
                </a>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto aspect-[3/2]">
                  <Image
                    src="/hotel pay/Enriching Payment Experiences for Hotels & Restaurants.png"
                    alt="Enriching Payment Experiences for Hotels & Restaurants"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Description Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-lg text-slate-700 leading-relaxed max-w-4xl mx-auto">
              Add a seamless and integrated payment experience through your existing technology solutions. offer dynamic payment gateway, customized ivr, qr codes, invoice links, epos and edc solutions
            </p>
          </div>
        </section>

        {/* Challenge 1: Go Contactless */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto aspect-[3/2]">
                  <Image
                    src="/hotel pay/Go Contactless-The new normal.png"
                    alt="Go Contactless - The new normal"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="inline-block px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Your Challenges
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Go Contactless-The new normal
                </h2>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Be COVID-19 guidelines compliant.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Go digital & be paperless.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-2 bg-[#7B4DB5] text-white text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Solutions
                </div>

                <h3 className="text-xl font-bold text-black mb-4">
                  Single Dashboard View
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Avoid multiple systems for digital payments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Easy integration with your existing system.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 3: Losing Customers */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto aspect-[3/2]">
                  <Image
                    src="/hotel pay/Losing Customers due to lack of payment options.png"
                    alt="Losing Customers due to lack of payment options"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="inline-block px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Your Challenges
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Losing Customers due to lack of payment options
                </h2>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Keeping up with ever increasing digital payment options is difficult</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Build consistent payment experience across all touch points.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-2 bg-[#7B4DB5] text-white text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Solutions
                </div>

                <h3 className="text-xl font-bold text-black mb-4">
                  Spoil your customers with choices
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Options to choose from debit cards to credit cards, internet banking to UPI from 140+ partners.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">In-built payment disbursement system helps ease vendor payments.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-black text-center mb-16">
              Features of IndyPay Hotelpay Payment Solutions
            </h2>

            <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-12 items-center max-w-6xl mx-auto">
              {/* Left Features */}
              <div className="space-y-10 lg:text-right">
                {/* Feature 1 */}
                <div className="flex lg:flex-row-reverse items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Central Reservation Systems</h3>
                    <p className="text-sm text-slate-600 leading-snug">Single dashboard view of your room inventory from multiple OTAs.</p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex lg:flex-row-reverse items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Channel Management System</h3>
                    <p className="text-sm text-slate-600 leading-snug">Automate room availability & prices with OTAs with a single click & collect payments on the same platform.</p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex lg:flex-row-reverse items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Mobilise IT</h3>
                    <p className="text-sm text-slate-600 leading-snug">Be future ready with mobile payments & personalised mobile travel guides for your guests.</p>
                  </div>
                </div>
              </div>

              {/* Center Phone Image */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-sm aspect-[9/19]">
                  <Image
                    src="/hotel pay/Features of IndyPay Hotelpay Payment Solutions.png"
                    alt="IndyPay Hotelpay App Features"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Right Features */}
              <div className="space-y-10">
                {/* Feature 4 */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Internet Booking Engines</h3>
                    <p className="text-sm text-slate-600 leading-snug">Keep in-sync both of your online and offline room reservations.</p>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">50+ Property Management System</h3>
                    <p className="text-sm text-slate-600 leading-snug">Now manage your multiple property anytime, anywhere using our SaaS platform.</p>
                  </div>
                </div>

                {/* Feature 6 */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Business Insights</h3>
                    <p className="text-sm text-slate-600 leading-snug">Your data tells a story.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-black text-black mb-4">
                Ready to transform your hotel's payment experience?
              </h2>
              <p className="text-base text-slate-600 mb-8 max-w-2xl mx-auto">
                Join hundreds of hotels and restaurants using IndyPay Hotelpay to streamline payments and enhance guest experience.
              </p>
              <button className="px-8 py-4 bg-[#7B4DB5] text-white font-semibold rounded-lg hover:bg-[#6B3DA5] transition-colors">
                Request Demo
              </button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
