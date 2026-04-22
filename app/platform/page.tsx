import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import Image from "next/image";

export default function PlatformPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7B4DB5] to-[#3B5FD4] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900">Platform</h1>
                </div>
                <p className="text-lg font-semibold text-slate-700 leading-snug">
                  Innovative Suite of Business and Financial Institution Solutions
                </p>
                <p className="text-sm text-slate-600 mt-4 leading-relaxed max-w-xl">
                  IndyPay&apos;s open-technology platform helps businesses move money faster with a complete stack for collections,
                  payouts, reconciliation, and operational controls—built to scale across channels.
                </p>

                <div className="mt-8">
                  <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide font-semibold">Explore modules</p>
                  <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
                    {[
                      { title: "Payments in a Box", href: "/platform/payments-in-a-box" },
                      { title: "Embedded Finance", href: "/platform/embedded-finance" },
                      { title: "Cash Management Services", href: "/platform/cash-management-services" },
                      { title: "CMS", href: "/platform/cms" },
                      { title: "Card in a Box", href: "/platform/card-in-a-box" },
                      { title: "Financial Inclusion", href: "/platform/financial-inclusion" },
                    ].map((m) => (
                      <Link
                        key={m.title}
                        href={m.href}
                        className="rounded-xl bg-white border border-slate-200 px-4 py-3 hover:border-[#7B4DB5] hover:shadow-sm transition-all"
                      >
                        <div className="text-sm font-bold text-slate-900">{m.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Explore →</div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
                  <Image
                    src="/images/platform/platform-1.png"
                    alt="IndyPay Platform overview illustration"
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

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7B4DB5] to-[#3B5FD4] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10m0 0l-8-4V7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Payments in a Box solution</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  IndyPay enables businesses to move money 24×7 with a ready-to-launch payments stack covering collections, reconciliation,
                  settlements, and reporting across the value chain.
                </p>
                <Link
                  href="/platform/payments-in-a-box"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7B4DB5] hover:gap-3 transition-all"
                >
                  Explore Payments in a Box
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                <Image
                  src="/images/platform/platform-1.png"
                  alt="Payments in a Box illustration"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7B4DB5] to-[#3B5FD4] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Embedded Finance</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  Embedded Finance integrates financial services into non-financial platforms—improving monetisation, retention, and
                  real-time visibility with seamless experiences.
                </p>
                <Link
                  href="/platform/embedded-finance"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7B4DB5] hover:gap-3 transition-all"
                >
                  Explore Embedded Finance
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="lg:order-1 rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                <Image
                  src="/images/platform/platform-2.png"
                  alt="Embedded Finance illustration"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7B4DB5] to-[#3B5FD4] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h6l3-9 6 18 3-9h3" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Cash Management Services</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  IndyPay optimises accounts receivable and payable processes through 360-degree fund flow management—bringing better
                  control, automation, and reporting to finance operations.
                </p>
                <Link
                  href="/platform/cash-management-services"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7B4DB5] hover:gap-3 transition-all"
                >
                  Explore Cash Management Services
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                <Image
                  src="/images/platform/platform-2.png"
                  alt="Cash Management Services illustration"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7B4DB5] to-[#3B5FD4] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18v10H3V7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11h18" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 15h4" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Card in a Box</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  Launch card programs with policy controls and seamless issuance across multiple channels—built for partners who need speed,
                  security, and reporting.
                </p>
                <Link
                  href="/platform/card-in-a-box"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7B4DB5] hover:gap-3 transition-all"
                >
                  Explore Card in a Box
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="lg:order-1 rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                <Image
                  src="/images/platform/platform-3.png"
                  alt="Card in a Box illustration"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7B4DB5] to-[#3B5FD4] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Financial Inclusion</h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                  Deliver financial services to the last mile with accessible journeys, multi-language support, and dependable operations.
                </p>
                <Link
                  href="/platform/financial-inclusion"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7B4DB5] hover:gap-3 transition-all"
                >
                  Explore Financial Inclusion
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                <Image
                  src="/images/platform/platform-3.png"
                  alt="Financial Inclusion illustration"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
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

