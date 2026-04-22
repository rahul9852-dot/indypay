import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import Link from "next/link";

function PurpleImage(props: { src: string; alt: string; priority?: boolean }) {
  const { src, alt, priority } = props;
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
      <Image
        src={src}
        alt={alt}
        width={1400}
        height={900}
        className="w-full h-auto"
        priority={priority}
        style={{ filter: "hue-rotate(250deg) saturate(1.35) contrast(1.05)" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#7B4DB5]/15 to-[#3B5FD4]/10" />
    </div>
  );
}

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
                <p className="text-base text-slate-700 mt-6 leading-relaxed max-w-xl">
                  IndyPay helps businesses collect, pay, reconcile, and manage money movement with reliability and clear controls.
                  We focus on outcomes: higher success rates, faster operations, and better visibility.
                </p>

                <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-xl">
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

              <PurpleImage src="/images/about/about-1.png" alt="IndyPay story illustration" priority />
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">Our vision</h2>
                <p className="text-base text-slate-700 mt-4 leading-relaxed max-w-xl">
                  Make digital payments simple and dependable for every business—so money movement becomes a growth lever, not an
                  operational burden.
                </p>

                <h3 className="text-2xl font-black text-slate-900 mt-10">Our mission</h3>
                <p className="text-base text-slate-700 mt-4 leading-relaxed max-w-xl">
                  Build a secure, scalable payments stack that works across channels, supports teams with clear tooling, and helps
                  businesses operate with confidence.
                </p>
              </div>

              <div className="lg:order-1">
                <PurpleImage src="/images/about/about-3.png" alt="Vision and mission illustration" />
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

            <div className="mt-10 grid lg:grid-cols-2 gap-10 items-center">
              <PurpleImage src="/images/about/about-4.png" alt="Values illustration" />

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { t: "Reliability", d: "We optimise for uptime, success rates, and predictable operations." },
                  { t: "Clarity", d: "We design for visibility—teams should always know what happened and why." },
                  { t: "Security", d: "We treat trust as a feature and build with strong controls by default." },
                  { t: "Customer-first", d: "We build with real merchant problems in mind, not just features." },
                ].map((v) => (
                  <div key={v.t} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="text-sm font-black text-slate-900">{v.t}</div>
                    <div className="text-sm text-slate-600 mt-2 leading-relaxed">{v.d}</div>
                  </div>
                ))}
              </div>
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

