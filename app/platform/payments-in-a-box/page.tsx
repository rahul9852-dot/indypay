import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PaymentsInABoxPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl">
              <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">Payments in a Box</p>
              <h1 className="text-4xl md:text-5xl font-black text-black leading-tight">
                Go live with payments in days, not months
              </h1>
              <p className="text-base text-slate-700 mt-6 leading-snug">
                Everything you need to accept, reconcile, and settle payments—packaged as ready-to-launch modules.
              </p>
            </div>

            <div className="mt-10 grid md:grid-cols-3 gap-6">
              {[
                { title: "Checkout & links", body: "Launch payment experiences for web, app, and offline flows." },
                { title: "Methods & routing", body: "Cards, UPI, netbanking, wallets with smart routing." },
                { title: "Settlements & reporting", body: "Track success rates, settlements, and reconciliation." },
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7B4DB5] to-[#3B5FD4] flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                    </svg>
                  </div>
                  <div className="text-lg font-black text-slate-900">{c.title}</div>
                  <div className="text-sm text-slate-600 mt-2 leading-snug">{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

