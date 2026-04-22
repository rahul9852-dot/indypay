import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MobileMockup } from "@/components/ui/DeviceMockup";

export default function SocietyPayPage() {
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
                  <h1 className="text-3xl md:text-4xl font-black text-black">
                    Give Your Society A Digital Payments Makeover
                  </h1>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  Tired of going around residences asking for payments from residents? Facing difficulty in account reconciliation and managing defaulters?
                </p>

                <p className="text-base text-slate-700 leading-snug">
                  With IndyPay's societypay solution, smoothen your daily operations. We promise to deliver a hassle-free modern payment solution for you and your residents.
                </p>
              </div>

              {/* Right - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full aspect-[16/10] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Society Dashboard Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with society dashboard image</p>
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
                <div className="w-full aspect-[16/10] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Digital Payment Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with contactless payment image</p>
                  </div>
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="inline-block px-4 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded mb-4">
                  YOUR CHALLENGES
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Physical Payment Collection
                </h2>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></span>
                    <span className="text-base text-slate-700 leading-snug">Be COVID-19 safe.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></span>
                    <span className="text-base text-slate-700 leading-snug">Door to door funds collection</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-1.5 bg-yellow-400 text-slate-800 text-xs font-bold uppercase tracking-wider rounded mb-4">
                  SOLUTIONS
                </div>

                <h3 className="text-xl md:text-2xl font-black text-black mb-4">
                  Go Contactless-The new normal
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700 leading-snug">Ensured safety for all with digital payment.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700 leading-snug">No need for customers to install any app.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 2: Difficulty in Managing Cash */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="inline-block px-4 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded mb-4">
                  YOUR CHALLENGES
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Difficulty in Managing Cash
                </h2>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></span>
                    <span className="text-base text-slate-700 leading-snug">Security issues during handling cash.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></span>
                    <span className="text-base text-slate-700 leading-snug">Timely payment disbursement to multiple vendor.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-1.5 bg-yellow-400 text-slate-800 text-xs font-bold uppercase tracking-wider rounded mb-4">
                  SOLUTIONS
                </div>

                <h3 className="text-xl md:text-2xl font-black text-black mb-4">
                  Spoil residents with choices
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700 leading-snug">Options to choose from debit cards to credit cards, internet banking to UPI from 45+ partner banks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700 leading-snug">Allow residents to pay from the comfort of their homes or make physical payments at your front office</span>
                  </li>
                </ul>
              </div>

              {/* Right - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-md aspect-[3/4] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Mobile Payment App Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with mobile payment app image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 3: Digitalizing administrative tasks */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image Placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-full aspect-[16/10] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Dashboard Analytics Image</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with dashboard analytics image</p>
                  </div>
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="inline-block px-4 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded mb-4">
                  YOUR CHALLENGES
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Digitalizing administrative tasks
                </h2>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></span>
                    <span className="text-base text-slate-700 leading-snug">Keeping books of accounts updated.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></span>
                    <span className="text-base text-slate-700 leading-snug">Difficult to keep a track of activities, notices & late payments/ defaulters.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-1.5 bg-yellow-400 text-slate-800 text-xs font-bold uppercase tracking-wider rounded mb-4">
                  SOLUTIONS
                </div>

                <h3 className="text-xl md:text-2xl font-black text-black mb-4">
                  The new age Mantra- Go Green!
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700 leading-snug">We digitize your book of accounts to ensure security & update it automatically for ease of use.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700 leading-snug">Go paperless keeping track of late payments/ defaulters online</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-black text-center mb-16">
              Features of IndyPay Society Payment Solutions
            </h2>

            <div className="grid lg:grid-cols-3 gap-12 items-start">
              {/* Left Column - Features */}
              <div className="space-y-12">
                {/* Automated Task Management */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl border-2 border-blue-600 flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-black mb-3">Automated Task Management</h3>
                  <p className="text-sm text-slate-700 leading-snug">
                    Automated invoicing, settlement, payment reminder & reconciliation.
                  </p>
                </div>

                {/* Digitalize IT */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl border-2 border-blue-600 flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-black mb-3">Digitalize IT</h3>
                  <p className="text-sm text-slate-700 leading-snug">
                    Maintain digital records & get access to Settlement reports, MIS reports, late payments/ defaulters list, activity reports etc.
                  </p>
                </div>

                {/* High level of Customization */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl border-2 border-blue-600 flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-black mb-3">High level of Customization</h3>
                  <p className="text-sm text-slate-700 leading-snug">
                    Using your white-labeled dashboard, create events; send out notifications for new/overdue payments.
                  </p>
                </div>
              </div>

              {/* Center - Mobile Mockup */}
              <div className="flex items-center justify-center">
                <MobileMockup>
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto text-blue-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-slate-600 font-semibold">Society App Interface</p>
                    </div>
                  </div>
                </MobileMockup>
              </div>

              {/* Right Column - Features */}
              <div className="space-y-12">
                {/* Residents Management System */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl border-2 border-blue-600 flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-black mb-3">Residents Management System</h3>
                  <p className="text-sm text-slate-700 leading-snug">
                    Manage past and current records of all residents on our platform for easy one-stop access.
                  </p>
                </div>

                {/* Realize ROI Quickly */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl border-2 border-blue-600 flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-black mb-3">Realize ROI Quickly</h3>
                  <p className="text-sm text-slate-700 leading-snug">
                    With quick integration and easy onboarding, digitally empower your society.
                  </p>
                </div>

                {/* Advanced Data Analytics */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl border-2 border-blue-600 flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-black mb-3">Advanced Data Analytics</h3>
                  <p className="text-sm text-slate-700 leading-snug">
                    Enhance your operational efficiency with data backed business insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-slate-50">
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
