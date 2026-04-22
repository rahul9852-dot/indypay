import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function SchoolPayPage() {
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-black">Payment Solutions for Schools</h1>
                </div>

                <p className="text-base text-slate-700 mb-8 leading-snug">
                  schoolpay is the perfect platform dedicated to help your educational institutes' collect fees and manage your Fee Structures and Vendor related expenses on a real time basis. With schoolpay, understand how the problems of the education sector are being solved.
                </p>
              </div>

              {/* Right - Image with Icons */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-lg aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center relative">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">School Dashboard Image Placeholder</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with dashboard screenshot showing UPI, Mobile Banking, Debit & Credit Cards, View Payment Status, Invoice Details</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Description */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-lg text-slate-700 leading-snug max-w-4xl mx-auto">
              schoolpay provides educational institutions with distinct freedom to interact with the parents on a single platform for all their transactions.
            </p>
          </div>
        </section>

        {/* Challenge 1: Go Contactless */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-lg aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Dashboard Image Placeholder</p>
                    <p className="text-slate-300 text-sm mt-2">Collect Fees, Manage Fee Structure, Manage Vendor Expenses</p>
                  </div>
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

                <div className="inline-block px-4 py-2 bg-yellow-400 text-black text-xs font-bold uppercase tracking-wide rounded mb-4">
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
                    <span className="text-sm text-slate-700">Have a 360° view of all your properties.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Easy integration with existing system.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 2: Digitalizing Administrative Tasks */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="inline-block px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Your Challenges
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Digitalizing front-line administrative tasks
                </h2>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Multi-channel fees collection & reconciliation.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Difficult to keep a track of school activities, notices & defaulters.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-2 bg-yellow-400 text-black text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Solutions
                </div>

                <h3 className="text-xl font-bold text-black mb-4">
                  Create Experiences for millennials
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Payment from comfort of their homes for working parents and automatic reconciliation.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">View payment status, view & download receipts, invoice details.</span>
                  </li>
                </ul>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-lg aspect-[4/3] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Payment Interface Image Placeholder</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with payment interface screenshot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 3: High Cost of Payment Collection */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-lg aspect-[4/3] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Analytics Dashboard Image Placeholder</p>
                    <p className="text-slate-300 text-sm mt-2">Received Payment, Pending Payment</p>
                  </div>
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="inline-block px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Your Challenges
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  High Cost of Payment Collection
                </h2>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Labor Costs when reconciling accounts/payments (Operations, Finance, Admin, etc.) and follow up with parents.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Bear bank charges on bounced cheques.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-2 bg-yellow-400 text-black text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Solutions
                </div>

                <h3 className="text-xl font-bold text-black mb-4">
                  Affordability & Transparency
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Accept anything & everything- from cash to cards, POS to Digital payments, cheques etc.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">No hidden charges & complete transparency.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 4: Vendor Payment Management */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="inline-block px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Your Challenges
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Vendor Payment Management
                </h2>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">On time fees collection & payment disbursement to multiple vendors.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-2"></div>
                    <span className="text-base text-slate-700">Storing & auditing physical records of past payments.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-2 bg-yellow-400 text-black text-xs font-bold uppercase tracking-wide rounded mb-4">
                  Solutions
                </div>

                <h3 className="text-xl font-bold text-black mb-4">
                  Vendor Payment Management
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Make easy one-click payment disbursement to multiple vendors.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700">Digital records with easy access & in-house analysis to aid decision making.</span>
                  </li>
                </ul>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-lg aspect-[16/9] rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 text-base font-semibold">Vendor Payout Dashboard Image Placeholder</p>
                    <p className="text-slate-300 text-sm mt-2">Replace with vendor payout screenshot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-black text-center mb-4">
              Features of IndyPay Schoolpay Payment Solutions
            </h2>
            <p className="text-center text-base text-slate-700 leading-relaxed max-w-4xl mx-auto mb-16">
              schoolpay is a transaction ecosystem enabler allowing parents and institutes to transact seamlessly with the highest security standards. We are on the mission to ease fees payment for educational institutes and parents and make it less complicated.
            </p>

            <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-12 items-center max-w-6xl mx-auto">
              {/* Left Features */}
              <div className="space-y-10 lg:text-right">
                {/* Feature 1 */}
                <div className="flex lg:flex-row-reverse items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Automated Task Management</h3>
                    <p className="text-sm text-slate-600 leading-snug">Automated invoicing, settlement, payment reminder and reconciliation.</p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex lg:flex-row-reverse items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Admission Management System</h3>
                    <p className="text-sm text-slate-600 leading-snug">Manage admissions with Schoolpay's integrated platform. Maintain digital records of all students for easier and secure access.</p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex lg:flex-row-reverse items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Digitalize IT</h3>
                    <p className="text-sm text-slate-600 leading-snug">Maintain all records digitally and get easy access to Settlement reports, MIS reports, defaulters list, activity reports etc.</p>
                  </div>
                </div>
              </div>

              {/* Center Phone Image */}
              <div className="flex justify-center">
                <div className="w-64 h-[520px] bg-slate-900 rounded-[45px] p-2 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-[38px] flex items-center justify-center overflow-hidden">
                    <div className="text-center p-4">
                      <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-slate-400 text-sm font-semibold">Mobile App Screenshot</p>
                      <p className="text-slate-300 text-xs mt-1">Replace with app image</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Features */}
              <div className="space-y-10">
                {/* Feature 4 */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">Quickly achieve ROI</h3>
                    <p className="text-sm text-slate-600 leading-snug">Real-time tracking of transactions, reconciliation with minimum investments. Reduced expenses on non-teaching activities and reduced human error.</p>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 flex items-center justify-center shrink-0 bg-white">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-black mb-1">High level of Customization</h3>
                    <p className="text-sm text-slate-600 leading-snug">Easily customizable dashboard as per your requirement Create activities, fees structure, class, division as per your requirement with our easy-to-use portal.</p>
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
                    <h3 className="text-base font-bold text-black mb-1">Your data tells a story</h3>
                    <p className="text-sm text-slate-600 leading-snug">Real-time data tracking, with in-depth analysis of your data, to help you take intelligent decisions and enhance your operational efficiency.</p>
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
                Ready to transform your school's payment experience?
              </h2>
              <p className="text-base text-slate-600 mb-8 max-w-2xl mx-auto">
                Join hundreds of educational institutions using IndyPay Schoolpay to streamline fee collection and vendor management.
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
