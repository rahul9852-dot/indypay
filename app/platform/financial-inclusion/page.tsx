import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function FinancialInclusionPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">Financial Inclusion</p>
                <h1 className="text-4xl md:text-5xl font-black text-black leading-tight">
                  Reach more users with accessible payment rails
                </h1>
                <p className="text-base text-slate-700 mt-6 leading-snug">
                  Enable reliable, low-friction collections and payouts designed for diverse user groups and operating environments.
                </p>
                <div className="mt-8 grid sm:grid-cols-2 gap-3">
                  {[
                    "Low-bandwidth friendly journeys",
                    "Assisted and agent-led flows",
                    "Multi-language experiences",
                    "Transparent reporting & support",
                  ].map((t) => (
                    <div key={t} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-br from-[#7B4DB5]/10 to-[#3B5FD4]/10 p-6">
                    <div className="text-sm font-black text-slate-900">Coverage</div>
                    <div className="text-xs text-slate-600 mt-1">Designed for scale across locations and segments.</div>
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {[
                        { k: "Users", v: "Rural" },
                        { k: "Mode", v: "Assisted" },
                        { k: "Support", v: "Multi-lang" },
                      ].map((b) => (
                        <div key={b.k} className="rounded-xl bg-white border border-slate-200 p-4 text-center">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{b.k}</div>
                          <div className="text-sm font-black text-slate-900 mt-1">{b.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7B4DB5] to-[#3B5FD4] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900">Built for trust</div>
                        <div className="text-xs text-slate-600 mt-1">
                          Clear status, receipts, and support options for every transaction.
                        </div>
                      </div>
                    </div>
                  </div>
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

