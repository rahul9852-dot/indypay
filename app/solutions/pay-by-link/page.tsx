import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export default function PayByLinkPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        
        {/* Hero Section */}
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-3xl md:text-4xl font-black text-black text-center mb-8">
              Pay by Link Solutions
            </h1>
            <p className="text-base text-slate-700 text-center max-w-3xl mx-auto leading-snug mb-16">
              Accept payments instantly with our flexible link-based payment solutions. Choose the option that best fits your business needs.
            </p>

            {/* Two Options Grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* InvoicePay Option */}
              <Link 
                href="/solutions/invoicepay"
                className="group bg-white rounded-2xl border-2 border-slate-200 p-8 hover:border-blue-600 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-black group-hover:text-blue-600 transition-colors">
                    invoicepay
                  </h2>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  Create and send professional invoices with payment links. Perfect for businesses that need detailed billing and invoice management.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700 leading-snug">Generate detailed invoices</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700 leading-snug">Track payment status</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700 leading-snug">Send automated reminders</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700 leading-snug">Professional invoice templates</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-blue-600 font-bold group-hover:gap-4 transition-all">
                  <span>Learn More</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* NowPay Option */}
              <Link 
                href="/solutions/nowpay"
                className="group bg-white rounded-2xl border-2 border-slate-200 p-8 hover:border-blue-600 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-black group-hover:text-blue-600 transition-colors">
                    nowpay
                  </h2>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  Get paid instantly with quick payment links. Ideal for fast transactions and on-the-go payments without complex invoicing.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700 leading-snug">Instant payment links</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700 leading-snug">No invoice required</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700 leading-snug">Share via SMS, email, or WhatsApp</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-700 leading-snug">Quick setup in seconds</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-blue-600 font-bold group-hover:gap-4 transition-all">
                  <span>Learn More</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-black text-black text-center mb-12">
              Why Choose Pay by Link?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-blue-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-black mb-3">Instant Setup</h3>
                <p className="text-sm text-slate-700 leading-snug">
                  Create payment links in seconds without any technical integration
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-blue-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-black mb-3">Secure Payments</h3>
                <p className="text-sm text-slate-700 leading-snug">
                  Bank-grade security with encrypted payment processing
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-blue-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-black mb-3">Real-time Tracking</h3>
                <p className="text-sm text-slate-700 leading-snug">
                  Monitor all payments with detailed analytics and reports
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-base text-slate-700 mb-8 max-w-2xl mx-auto leading-snug">
              Choose the payment solution that works best for your business and start accepting payments today
            </p>
            <a
              href="#"
              className="inline-block px-10 py-4 bg-blue-600 text-white text-base font-bold rounded-lg hover:bg-blue-700 transition-all"
            >
              Get Started Now
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
