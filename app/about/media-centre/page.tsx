import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function MediaCentrePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-3">Media Centre</p>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                  News, updates, and brand resources
                </h1>
                <p className="text-base text-slate-700 mt-6 leading-relaxed max-w-xl">
                  Find company updates, product launches, and media resources. For press enquiries, reach out through your preferred
                  channel and we&apos;ll respond quickly.
                </p>

                <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-xl">
                  {[
                    { t: "Press releases", d: "Major milestones and announcements." },
                    { t: "Brand kit", d: "Logos, colors, and guidelines." },
                    { t: "Product updates", d: "What changed and why it matters." },
                    { t: "Stories", d: "How businesses use IndyPay." },
                  ].map((x) => (
                    <div key={x.t} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="text-sm font-black text-slate-900">{x.t}</div>
                      <div className="text-sm text-slate-600 mt-2 leading-relaxed">{x.d}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                <Image
                  src="/images/about/about-4.png"
                  alt="Media resources illustration"
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

