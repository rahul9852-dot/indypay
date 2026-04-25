import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function HealthcarePayPage() {
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-black">Healthcare Payments Collection Made Easy</h1>
                </div>

                <p className="text-base text-slate-700 mb-8 leading-snug">
                  With healthcarepay easily tackle the payment problems of the healthcare industry.
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
                <div className="w-full max-w-4xl">
                  <Image
                    src="/healthcare pay/Healthcare Payments Collection Made Easy.png"
                    alt="Healthcare Payments Collection Made Easy"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 1: Physical Payment Collection */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/healthcare pay/Enriching Payment Experiences for Hotels & Restaurants.png"
                    alt="Go Contactless - The new normal"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="inline-block px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Your Challenges
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Physical Payment Collection
                </h2>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Be COVID-19 safe and follow government regulations.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Physical Interaction with Customers for payment collection.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-2 bg-[#7B4DB5] text-white text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Solutions
                </div>

                <h3 className="text-xl font-bold text-black mb-4">
                  Go Contactless-The new normal
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Online payment - easy & safe, avoid multiple touchpoints.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Customers pay online through any digital payment method.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 2: Efficiency in Administrative tasks */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="inline-block px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Your Challenges
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Efficiency in Administrative tasks
                </h2>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Human Errors & Delay in reconciliation of bills.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Lots of paperwork involved- Hassle for staff to process.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-2 bg-[#7B4DB5] text-white text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Solutions
                </div>

                <h3 className="text-xl font-bold text-black mb-4">
                  Enabling Digitalization
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Easy integration with existing system for real time reconciliation.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Go Green & Paperless- Avoid multiple invoices for multiple procedures.</span>
                  </li>
                </ul>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/healthcare pay/Efficiency in Administrative tasks.png"
                    alt="Enabling Digitalization"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 3: Losing Customers due to lack of Payment options */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/healthcare pay/Enriching Payment Experiences for Hotels & Restaurants.png"
                    alt="Spoil your Partners with choices"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="inline-block px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Your Challenges
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Losing Customers due to lack of Payment options
                </h2>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Keeping up with increasing payment options is difficult.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Hassle for Finance and Accounts team to provide updated information on overdue patient bills.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-2 bg-[#7B4DB5] text-white text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Solutions
                </div>

                <h3 className="text-xl font-bold text-black mb-4">
                  Spoil your Partners with choices
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Options to choose from debit cards to credit cards, internet banking to UPI from 45+ partner banks.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">360° View of all operations across multiple locations.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 4: Insurance Claims Processing */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="inline-block px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Your Challenges
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Insurance Claims Processing
                </h2>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Delayed reimbursements from insurance companies.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Complex documentation and verification processes.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-2 bg-[#7B4DB5] text-white text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Solutions
                </div>

                <h3 className="text-xl font-bold text-black mb-4">
                  Streamlined Claims Management
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Direct integration with insurance providers for faster processing.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Automated documentation and real-time claim status tracking.</span>
                  </li>
                </ul>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/healthcare pay/Insurance Claims Processing.png"
                    alt="Streamlined Claims Management"
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
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-slate-50 rounded-2xl shadow-lg p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-black text-black mb-4">
                Ready to modernize your healthcare payment system?
              </h2>
              <p className="text-base text-slate-600 mb-8 max-w-2xl mx-auto">
                Join leading healthcare providers using IndyPay Healthcarepay to streamline payments and improve patient experience.
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
