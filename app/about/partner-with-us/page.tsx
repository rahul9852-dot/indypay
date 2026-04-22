import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function PartnerWithUsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">Partner with us</p>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                  Build together, scale together
                </h1>
                <p className="text-base text-slate-700 mt-6 leading-relaxed max-w-xl">
                  IndyPay partners with platforms, agencies, and solution providers to help merchants launch faster and operate better.
                  Get technical support, enablement, and clear go-to-market paths.
                </p>

                <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-xl">
                  {[
                    { t: "Integration support", d: "Guidance from sandbox to production." },
                    { t: "Merchant onboarding", d: "Faster activation with predictable steps." },
                    { t: "Co-marketing", d: "Joint launches and shared success stories." },
                    { t: "Dedicated help", d: "Documentation and response channels." },
                  ].map((x) => (
                    <div key={x.t} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="text-sm font-black text-slate-900">{x.t}</div>
                      <div className="text-sm text-slate-600 mt-2 leading-relaxed">{x.d}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                <Image
                  src="/images/about/about-1.png"
                  alt="Partnership illustration"
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

