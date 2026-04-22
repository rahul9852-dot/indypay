import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function CardInABoxPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">Card in a Box</p>
                <h1 className="text-4xl md:text-5xl font-black text-black leading-tight">
                  Issue cards and control spend
                </h1>
                <p className="text-base text-slate-700 mt-6 leading-snug">
                  Create corporate card programs with policy controls, limits, and reporting built in.
                </p>
                <div className="mt-8 space-y-3">
                  {[
                    "Create teams and roles",
                    "Set merchant/category limits",
                    "Real-time alerts & controls",
                    "Unified reporting and reconciliation",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <div className="text-sm font-semibold text-slate-700 leading-snug">{t}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                <div className="rounded-2xl bg-linear-to-br from-[#7B4DB5] to-[#3B5FD4] p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-white/80">IndyPay Card</div>
                      <div className="text-lg font-black mt-1">Corporate</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18v10H3V7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center justify-between text-sm">
                    <div className="font-bold tracking-widest">**** **** **** 2481</div>
                    <div className="text-white/80">12/28</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { k: "Daily limit", v: "₹ 50,000" },
                    { k: "Category", v: "Travel, SaaS" },
                    { k: "Status", v: "Active" },
                    { k: "Alerts", v: "Instant" },
                  ].map((row) => (
                    <div key={row.k} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{row.k}</div>
                      <div className="text-sm font-black text-slate-900 mt-1">{row.v}</div>
                    </div>
                  ))}
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

