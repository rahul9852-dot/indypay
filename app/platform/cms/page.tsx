import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function CmsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">CMS</p>
                <h1 className="text-4xl md:text-5xl font-black text-black leading-tight">
                  Configure products without code
                </h1>
                <p className="text-base text-slate-700 mt-6 leading-snug">
                  Manage offerings, pricing, and operational settings from a clean admin experience—ship changes faster with fewer releases.
                </p>
                <div className="mt-8 grid sm:grid-cols-2 gap-3">
                  {[
                    "Toggle features by segment",
                    "Update pricing & rules",
                    "Manage content and flows",
                    "Audit-friendly changes",
                  ].map((t) => (
                    <div key={t} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                <div className="text-sm font-black text-slate-900 mb-4">Admin preview</div>
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-linear-to-r from-[#7B4DB5] to-[#3B5FD4] px-6 py-4 text-white">
                    <div className="text-xs font-bold uppercase tracking-widest">IndyPay Console</div>
                    <div className="text-sm font-black mt-1">Configuration</div>
                  </div>
                  <div className="p-6 space-y-3">
                    {[
                      { k: "Pricing", v: "UPI • Cards • NetBanking" },
                      { k: "Routing", v: "Smart routing enabled" },
                      { k: "Limits", v: "Per-transaction controls" },
                      { k: "Webhooks", v: "Retries + signing on" },
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

