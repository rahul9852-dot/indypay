import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">About IndyPay</p>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                  Payments infrastructure built for real-world businesses
                </h1>
                <p className="text-base text-slate-700 mt-6 leading-relaxed">
                  IndyPay helps businesses collect, pay, reconcile, and manage money movement with reliability and clear controls.
                  We focus on outcomes: higher success rates, faster operations, and better visibility.
                </p>

                <div className="mt-8 grid sm:grid-cols-3 gap-4">
                  {[
                    { k: "Always-on", v: "24×7 payments" },
                    { k: "Control", v: "Risk & limits" },
                    { k: "Clarity", v: "Reporting" },
                  ].map((s) => (
                    <div key={s.k} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{s.k}</div>
                      <div className="text-sm font-black text-slate-900 mt-1">{s.v}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  <a
                    href="#contact"
                    className="px-7 py-3 bg-[#7B4DB5] text-white text-sm font-bold rounded-lg hover:bg-[#6A3BA0] transition-all"
                  >
                    Talk to sales
                  </a>
                  <Link
                    href="/platform"
                    className="px-7 py-3 bg-white text-slate-900 text-sm font-bold rounded-lg border border-slate-200 hover:border-[#7B4DB5] transition-colors"
                  >
                    Explore platform →
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto">
                  <div className="relative w-full aspect-[3/2]">
                    <Image
                      src="/about indypay/Payments infrastructure.png"
                      alt="Payments infrastructure"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">Our vision</h2>
                <p className="text-base text-slate-700 mt-4 leading-relaxed">
                  Make digital payments simple and dependable for every business—so money movement becomes a growth lever, not an
                  operational burden.
                </p>

                <h3 className="text-2xl font-black text-slate-900 mt-10">Our mission</h3>
                <p className="text-base text-slate-700 mt-4 leading-relaxed">
                  Build a secure, scalable payments stack that works across channels, supports teams with clear tooling, and helps
                  businesses operate with confidence.
                </p>
              </div>

              <div className="lg:order-1 flex items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto">
                  <div className="relative w-full aspect-[3/2]">
                    <Image
                      src="/about indypay/Our vision.png"
                      alt="Our vision"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">Our values</h2>
              <p className="text-base text-slate-700 mt-4 leading-relaxed">
                These are the principles we use to build products, support customers, and improve every day.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
              {[
                { t: "Transformational", d: "Lead change by empowering the world financially, one transaction at a time", img: "/about indypay/Transformational.png" },
                { t: "Innovative", d: "Imaginative, futuristic, and unique, we bring original ideas to life", img: "/about indypay/Innovative.png" },
                { t: "Experimental", d: "We are risk-takers who often challenge the status quo", img: "/about indypay/Experimental.png" },
                { t: "Authentic", d: "We are relatable, simple, practical, and consistent", img: "/about indypay/Authentic.png" },
                { t: "Empowering", d: "Enabling growth, self-belief, confidence, and independence", img: "/about indypay/Empowering.png" },
              ].map((v) => (
                <div key={v.t} className="flex flex-col items-center text-center">
                  {/* Round image container */}
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center mb-4 overflow-hidden relative">
                    <Image
                      src={v.img}
                      alt={v.t}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-lg font-black text-slate-900">{v.t}</div>
                  <div className="text-sm text-slate-600 mt-2 leading-relaxed">{v.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-linear-to-br from-[#7B4DB5] to-[#3B5FD4]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="rounded-3xl bg-white/10 border border-white/20 p-10 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-white">Build with IndyPay</h2>
              <p className="text-white/90 mt-4 max-w-2xl mx-auto">
                Whether you&apos;re launching payments or scaling operations, IndyPay helps you move faster—with control.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/platform"
                  className="px-8 py-3 bg-white text-slate-900 text-sm font-bold rounded-lg hover:bg-white/90 transition-all"
                >
                  Explore platform
                </Link>
                <Link
                  href="/about/partner-with-us"
                  className="px-8 py-3 bg-transparent text-white text-sm font-bold rounded-lg border border-white/30 hover:border-white/60 transition-colors"
                >
                  Partner with us →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

