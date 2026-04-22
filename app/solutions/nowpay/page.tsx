import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export default function NowPayPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-blue-600 leading-tight">NowPay</h1>
                </div>

                <p className="text-base text-slate-700 mb-4 leading-snug">
                  Get paid instantly with simple payment links—no website, no app, no complex setup.
                </p>
                <p className="text-base text-slate-700 mb-8 leading-snug">
                  Share a link via SMS, email, or WhatsApp and collect securely through cards, UPI, net banking, and wallets.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    "Create links in seconds",
                    "160+ payment options",
                    "Real-time status tracking",
                    "Fast settlements",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-4">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <div className="text-sm font-semibold text-slate-700 leading-snug">{t}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  <a
                    href="#"
                    className="px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Get Started
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                <div className="text-sm font-black text-slate-900 mb-6">Link preview</div>
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-blue-600 px-5 py-4 text-white">
                    <div className="text-sm font-bold">IndyPay</div>
                    <div className="text-xs text-blue-100 mt-1">Payment request</div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">Amount</div>
                      <div className="text-lg font-black text-slate-900">₹ 2,499</div>
                    </div>
                    <div className="mt-3 text-xs text-slate-600">
                      For: Consultation fee • Ref: NP-1024
                    </div>
                    <button className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
                      Pay Now
                    </button>
                    <div className="mt-3 text-[11px] text-slate-400 text-center">
                      Cards • UPI • NetBanking • Wallets
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-5">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Pro tip</div>
                  <div className="text-sm text-slate-700 mt-2 leading-snug">
                    Use payment links for quick collections and switch to invoices when you need detailed billing and reminders.
                  </div>
                  <Link href="/solutions/invoices" className="mt-3 inline-flex text-sm font-bold text-blue-600 hover:underline">
                    Explore invoicepay
                  </Link>
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

