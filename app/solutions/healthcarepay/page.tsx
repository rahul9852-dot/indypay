import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MobileMockup } from "@/components/ui/DeviceMockup";

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

              {/* Right - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full aspect-[16/10] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Healthcare Dashboard Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with healthcare payment dashboard image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 1: Physical Payment Collection */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md aspect-[4/3] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Payment Notification Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with payment notification image</p>
                  </div>
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

                <div className="inline-block px-4 py-2 bg-yellow-400 text-black text-xs font-bold uppercase tracking-wide rounded mb-4">
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

                <div className="inline-block px-4 py-2 bg-yellow-400 text-black text-xs font-bold uppercase tracking-wide rounded mb-4">
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

              {/* Right - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full aspect-[16/10] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Digital Payment Methods Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with payment methods image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 3: Losing Customers due to lack of Payment options */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full aspect-[16/10] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Payment Dashboard Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with payment dashboard image</p>
                  </div>
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

                <div className="inline-block px-4 py-2 bg-yellow-400 text-black text-xs font-bold uppercase tracking-wide rounded mb-4">
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

                <div className="inline-block px-4 py-2 bg-yellow-400 text-black text-xs font-bold uppercase tracking-wide rounded mb-4">
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

              {/* Right - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Insurance Claims Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with insurance processing image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-black text-center mb-16">
              Features of IndyPay Healthcarepay Payment Solutions
            </h2>

            <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-12 items-center max-w-6xl mx-auto">
              {/* Left Features */}
              <div className="space-y-10 lg:text-right">
                {/* Feature 1 */}
                <div className="flex lg:flex-row-reverse items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Patient Management System</h3>
                    <p className="text-sm text-slate-600 leading-snug">Integrated patient records with payment history and billing information.</p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex lg:flex-row-reverse items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Appointment Scheduling</h3>
                    <p className="text-sm text-slate-600 leading-snug">Book appointments online with integrated payment collection.</p>
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
                    <h3 className="text-base font-bold text-black mb-1">Digital Prescriptions</h3>
                    <p className="text-sm text-slate-600 leading-snug">E-prescriptions with integrated pharmacy payment options.</p>
                  </div>
                </div>
              </div>

              {/* Center Phone Image */}
              <div className="flex justify-center">
                <MobileMockup label="IndyPay Healthcarepay App" />
              </div>

              {/* Right Features */}
              <div className="space-y-10">
                {/* Feature 4 */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Insurance Integration</h3>
                    <p className="text-sm text-slate-600 leading-snug">Direct claims processing with major insurance providers.</p>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Mobile Health Payments</h3>
                    <p className="text-sm text-slate-600 leading-snug">Pay for consultations, tests, and medicines through mobile app.</p>
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
                    <h3 className="text-base font-bold text-black mb-1">Analytics & Reporting</h3>
                    <p className="text-sm text-slate-600 leading-snug">Comprehensive financial reports and payment analytics.</p>
                  </div>
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
