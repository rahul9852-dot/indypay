import Image from "next/image";
import RetailParticleCanvas from "./RetailParticleCanvas";

const INDUSTRIES = [
  {
    icon: "🎓",
    title: "Education",
    image: "/herosection/Education.png",
    subtitle: "Does your institute struggle with fee collection?",
    description: "schoolpay - a secure, end-to-end cashless payment solution for institutions and parents",
    details: "Enabling seamless transactions from a single platform while maintaining the highest levels of security.",
  },
  {
    icon: "🏨",
    title: "Hospitality",
    image: "/herosection/hf_20260424_121345_fe3befe1-e79c-4cd7-b8df-a8d7bc190c89.png",
    subtitle: "Do you want to improve your customer experience?",
    description: "Enriching Payment Experiences for Hotels & Restaurants",
    details: "Our Payments product suite is designed to provide a seamless payment experience for your customers",
  },
  {
    icon: "🛒",
    title: "Retail",
    image: "/herosection/retail.png",
    subtitle: "Are your customers demanding more ways to pay?",
    description: "Now get quick and hassle-free digital payments for your Retail Outlet",
    details: "It is a fantastic match! Both you and IndyPay offer an omnichannel experience.",
  },
  {
    icon: "🏦",
    title: "BFSI",
    image: "/herosection/BFSI.png",
    subtitle: "Need to Collect Payments for your Banking Institution?",
    description: "Complete payment solutions for financial institutions",
    details: "You have feet on the ground, a call centre, and a website for collecting payments. Our omnichannel payment solutions – PoS, ePoS, and SMS payment link – bring all of this together under one roof",
  },
  {
    icon: "🏦",
    title: "Financial Institutions",
    image: "/herosection/Financial Institutions.png",
    subtitle: "Customers are demanding better service!",
    description: "They want to transact outside of your bank branch, and IndyPay Human ATM is the solution",
    details: "Extend digital banking services at zero capital investment through a portable biometric android device",
  },
  {
    icon: "🚚",
    title: "Logistics",
    image: "/herosection/Logistics.png",
    subtitle: "You manage logistics, and we handle payment logistics for you",
    description: "Whether it is customers who pay you for services or you are paying vendors. We have the most efficient solution to be delivered to you",
    details: "",
  },
];

export default function Industries() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 space-y-20">
        {INDUSTRIES.map((industry, i) => (
          <div
            key={industry.title}
            data-aos="fade-up"
            data-aos-delay={i * 100}
          >
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Side - Content */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-24 h-24 rounded-[32px] bg-white flex items-center justify-center text-5xl shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    {industry.icon}
                  </div>
                  <h3 className="text-4xl font-black text-black">{industry.title}</h3>
                </div>

                <p className="text-base font-bold text-slate-800 mb-4">{industry.subtitle}</p>
                <p className="text-base font-normal text-slate-700 mb-6 leading-relaxed">{industry.description}</p>
                {industry.details && (
                  <p className="text-sm text-slate-600 mb-8 font-normal leading-relaxed">{industry.details}</p>
                )}

                <a
                  href="#"
                  className="inline-block px-7 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Know More
                </a>
              </div>

              {/* Right Side - Image */}
              <div className="flex items-center justify-center">

                {industry.title === "Retail" ? (
                  /* ── Retail: particle canvas card ────────────── */
                  <div className="relative w-full rounded-3xl overflow-hidden
                    bg-linear-to-br from-[#fdf4ff] via-[#fff0f8] to-[#fce8f3]
                    border border-pink-100
                    shadow-2xl shadow-pink-200/40
                    min-h-90 sm:min-h-110">

                    {/* Three.js pink particle field */}
                    <RetailParticleCanvas />

                    {/* Product image floats above canvas */}
                    <div className="relative z-10 w-full h-full flex items-center justify-center p-6 sm:p-10">
                      <Image
                        src={industry.image}
                        alt={industry.title}
                        width={580}
                        height={420}
                        className="object-contain w-full drop-shadow-xl"
                      />
                    </div>
                  </div>

                ) : (
                  /* ── All other industries: plain image ───────── */
                  <div className={`relative w-full max-w-8xl ${
                    industry.title === "BFSI" || industry.title === "Financial Institutions"
                      ? "aspect-2/3"
                      : "aspect-3/2"
                  }`}>
                    <Image
                      src={industry.image}
                      alt={industry.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
