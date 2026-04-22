import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function CulturePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">Culture</p>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                  Move fast, stay reliable
                </h1>
                <p className="text-base text-slate-700 mt-6 leading-relaxed max-w-xl">
                  We build for businesses that can&apos;t afford downtime. Our culture balances speed with craft: clear communication,
                  strong reviews, and empathy for users.
                </p>

                <div className="mt-8 space-y-3 max-w-xl">
                  {[
                    "Bias toward shipping, with guardrails",
                    "Write things down and share context",
                    "Be direct, be kind, be accountable",
                    "Learn continuously, measure outcomes",
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

              <div className="order-1 lg:order-2 rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                <Image
                  src="/images/about/about-3.png"
                  alt="Culture illustration"
                  width={1400}
                  height={900}
                  className="w-full h-auto"
                  style={{ filter: "hue-rotate(250deg) saturate(1.35) contrast(1.05)" }}
                  priority
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

