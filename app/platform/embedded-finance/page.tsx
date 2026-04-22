import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function EmbeddedFinancePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">Embedded Finance</p>
                <h1 className="text-4xl md:text-5xl font-black text-black leading-tight">
                  Build financial products inside your app
                </h1>
                <p className="text-base text-slate-700 mt-6 leading-snug">
                  Create seamless user journeys with payments, collections, and value-added services embedded in your workflows.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    "Embedded onboarding and verification",
                    "Custom flows for your user segments",
                    "Operational controls and audit trails",
                    "Scalable APIs for developers",
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
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-linear-to-r from-[#7B4DB5] to-[#3B5FD4] px-6 py-4 text-white">
                    <div className="text-sm font-black">Embedded flow preview</div>
                    <div className="text-xs text-white/80 mt-1">A clean, native experience</div>
                  </div>
                  <div className="p-6 space-y-3">
                    {[
                      { k: "Step 1", v: "User selects plan" },
                      { k: "Step 2", v: "KYC & verification" },
                      { k: "Step 3", v: "Pay and activate" },
                      { k: "Step 4", v: "Monitor + manage" },
                    ].map((row) => (
                      <div key={row.k} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{row.k}</div>
                        <div className="text-sm font-semibold text-slate-800">{row.v}</div>
                      </div>
                    ))}
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

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function EmbeddedFinancePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">Embedded Finance</p>
                <h1 className="text-4xl md:text-5xl font-black text-black leading-tight">
                  Build financial products inside your app
                </h1>
                <p className="text-base text-slate-700 mt-6 leading-snug">
                  Create seamless user journeys with payments, collections, and value-added services embedded in your workflows.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    "Embedded onboarding and verification",
                    "Custom flows for your user segments",
                    "Operational controls and audit trails",
                    "Scalable APIs for developers",
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
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-linear-to-r from-[#7B4DB5] to-[#3B5FD4] px-6 py-4 text-white">
                    <div className="text-sm font-black">Embedded flow preview</div>
                    <div className="text-xs text-white/80 mt-1">A clean, native experience</div>
                  </div>
                  <div className="p-6 space-y-3">
                    {[
                      { k: "Step 1", v: "User selects plan" },
                      { k: "Step 2", v: "KYC & verification" },
                      { k: "Step 3", v: "Pay and activate" },
                      { k: "Step 4", v: "Monitor + manage" },
                    ].map((row) => (
                      <div key={row.k} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{row.k}</div>
                        <div className="text-sm font-semibold text-slate-800">{row.v}</div>
                      </div>
                    ))}
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

