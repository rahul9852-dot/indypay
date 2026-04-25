import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function SocietyPayPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        
        {/* Hero Section */}
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-black">
                    Give Your Society A Digital Payments Makeover
                  </h1>
                </div>

                <p className="text-base text-slate-700 leading-snug mb-6">
                  Tired of going around residences asking for payments from residents? Facing difficulty in account reconciliation and managing defaulters?
                </p>

                <p className="text-base text-slate-700 leading-snug">
                  With IndyPay's societypay solution, smoothen your daily operations. We promise to deliver a hassle-free modern payment solution for you and your residents.
                </p>
              </div>

              {/* Right - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/society pay/Give Your Society A Digital Payments Makeover.png"
                    alt="Give Your Society A Digital Payments Makeover"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 1: Physical Payment Collection */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/society pay/YOUR CHALLENGES.png"
                    alt="Physical Payment Collection Challenges"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="inline-block px-4 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded mb-4">
                  YOUR CHALLENGES
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Physical Payment Collection
                </h2>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></span>
                    <span className="text-base text-slate-700 leading-snug">Be COVID-19 safe.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></span>
                    <span className="text-base text-slate-700 leading-snug">Door to door funds collection</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-1.5 bg-[#7B4DB5] text-white text-xs font-bold uppercase tracking-wider rounded mb-4">
                  SOLUTIONS
                </div>

                <h3 className="text-xl md:text-2xl font-black text-black mb-4">
                  Go Contactless-The new normal
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700 leading-snug">Ensured safety for all with digital payment.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700 leading-snug">No need for customers to install any app.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge 3: Digitalizing administrative tasks */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  <Image
                    src="/society pay/Digitalizing administrative tasks.png"
                    alt="Digitalizing administrative tasks"
                    width={800}
                    height={533}
                    className="w-full h-auto object-contain aspect-[3/2]"
                  />
                </div>
              </div>

              {/* Right - Content */}
              <div>
                <div className="inline-block px-4 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded mb-4">
                  YOUR CHALLENGES
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-black mb-6">
                  Digitalizing administrative tasks
                </h2>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></span>
                    <span className="text-base text-slate-700 leading-snug">Keeping books of accounts updated.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-2 shrink-0"></span>
                    <span className="text-base text-slate-700 leading-snug">Difficult to keep a track of activities, notices & late payments/ defaulters.</span>
                  </li>
                </ul>

                <div className="inline-block px-4 py-1.5 bg-[#7B4DB5] text-white text-xs font-bold uppercase tracking-wider rounded mb-4">
                  SOLUTIONS
                </div>

                <h3 className="text-xl md:text-2xl font-black text-black mb-4">
                  The new age Mantra- Go Green!
                </h3>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700 leading-snug">We digitize your book of accounts to ensure security & update it automatically for ease of use.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base text-slate-700 leading-snug">Go paperless keeping track of late payments/ defaulters online</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="w-full max-w-6xl mx-auto">
              <Image
                src="/society pay/Features of IndyPay Society Payment Solutions.png"
                alt="Features of IndyPay Society Payment Solutions"
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <a
              href="#"
              className="inline-block px-10 py-4 bg-blue-600 text-white text-base font-bold rounded-lg hover:bg-blue-700 transition-all"
            >
              Request demo
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
