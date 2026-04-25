import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

export default function PartnerWithUsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="pt-20 pb-16 bg-gradient-to-br from-purple-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-[#7B4DB5] text-4xl md:text-5xl  font-bold tracking-widest uppercase mb-3">Partner with us</p>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                Build together, scale together
              </h1>
              <p className="text-lg text-slate-700 mt-6 max-w-3xl mx-auto">
                Join IndyPay's partner ecosystem and unlock new opportunities for growth. We provide the tools, support, and resources you need to succeed.
              </p>
            </div>

            <div className="relative w-full max-w-4xl mx-auto aspect-[3/2]">
              <Image
                src="/partner/patner with us.png"
                alt="Partner with us"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </section>

        {/* Partner Benefits Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="relative w-full aspect-[3/2]">
                <Image
                  src="/partner/Partner .png"
                  alt="Partner benefits"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                  Why partner with IndyPay?
                </h2>
                <p className="text-lg text-slate-700 mb-6">
                  We empower our partners with cutting-edge payment solutions, dedicated support, and a collaborative approach to help you deliver exceptional value to your customers.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-[#7B4DB5] mr-3 text-xl">✓</span>
                    <span className="text-slate-700">Access to comprehensive payment infrastructure</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#7B4DB5] mr-3 text-xl">✓</span>
                    <span className="text-slate-700">Technical integration support and documentation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#7B4DB5] mr-3 text-xl">✓</span>
                    <span className="text-slate-700">Co-marketing opportunities and resources</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#7B4DB5] mr-3 text-xl">✓</span>
                    <span className="text-slate-700">Dedicated partner success team</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Growing Partner Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                  Grow your business with us
                </h2>
                <p className="text-lg text-slate-700 mb-6">
                  Our partner program is designed to help you scale your business while providing your customers with world-class payment solutions.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-[#7B4DB5] mr-3 text-xl">✓</span>
                    <span className="text-slate-700">Competitive revenue sharing models</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#7B4DB5] mr-3 text-xl">✓</span>
                    <span className="text-slate-700">Training and certification programs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#7B4DB5] mr-3 text-xl">✓</span>
                    <span className="text-slate-700">Priority access to new features and products</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#7B4DB5] mr-3 text-xl">✓</span>
                    <span className="text-slate-700">Ongoing business development support</span>
                  </li>
                </ul>
              </div>
              <div className="relative w-full aspect-[3/2] order-1 lg:order-2">
                <Image
                  src="/partner/growing patner.png"
                  alt="Growing partner"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-[#7B4DB5] to-purple-700">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to partner with us?
            </h2>
            <p className="text-lg text-purple-100 mb-8">
              Let's discuss how we can work together to create value for your customers and grow your business.
            </p>
            <button className="bg-white text-[#7B4DB5] px-8 py-4 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
              Get in Touch
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

