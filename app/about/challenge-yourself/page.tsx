import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function ChallengeYourselfPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">Careers</p>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">Challenge yourself</h1>
                <p className="text-base text-slate-700 mt-6 leading-relaxed max-w-xl">
                  IndyPay is built by people who like hard problems: payments reliability, scale, risk, and beautiful UX. If you enjoy
                  ownership and learning fast, you&apos;ll fit right in.
                </p>
                <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-xl">
                  {[
                    { t: "Ownership", d: "Small teams, clear accountability." },
                    { t: "Growth", d: "Mentorship + real responsibility." },
                    { t: "Impact", d: "Work that ships and matters." },
                    { t: "Craft", d: "Quality and reliability by default." },
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
                  src="/images/about/about-2.png"
                  alt="Team growth illustration"
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

