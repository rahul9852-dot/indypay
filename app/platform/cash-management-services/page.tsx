import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function CashManagementServicesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">
                  Cash Management Services
                </p>
                <h1 className="text-4xl md:text-5xl font-black text-black leading-tight">
                  Control your fund flows end-to-end
                </h1>
                <p className="text-base text-slate-700 mt-6 leading-snug">
                  Optimise accounts receivable and payable processes with 360-degree visibility, automation, and reporting.
                </p>

                <div className="mt-8 grid sm:grid-cols-2 gap-3">
                  {[
                    "Automated collections tracking",
                    "Vendor payouts and scheduling",
                    "Reconciliation and settlement reports",
                    "Role-based controls and audit trails",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-4">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <div className="text-sm font-semibold text-slate-700 leading-snug">{t}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                  <Image
                    src="/images/platform/platform-2.png"
                    alt="Cash Management Services illustration"
                    width={1200}
                    height={800}
                    className="w-full h-auto"
                    priority
                  />
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

