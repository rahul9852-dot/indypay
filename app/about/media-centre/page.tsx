import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";

const newsItems = [
  {
    title: "indypay partners with Wix, enabling Seamless Digital Payments for Business Owners in India",
    date: "May 20, 2024",
    description: "indypay, India's premier integrated omnichannel financial services technology platform, today announced its partnership with Wix.com Ltd .... Read more"
  },
  {
    title: "indypay expands Financial Services Ecosystem with acquisition of Finmapp, a personal finance management start-up",
    date: "November 21, 2023",
    description: "indypay, India's fast-growing integrated financial services platform, today announced the acquisition of Finfinity Technologies ..... Read more"
  },
  {
    title: "indypay empowers its merchants with a Zero-interest EMI Solution",
    date: "September 4, 2023",
    description: "indypay, India's first integrated omnichannel financial services platform, today announced the launch of a Zero-interest Brand EMI ..... Read more"
  },
  {
    title: "indypay becomes the first ONDC network participant enabling BHARAT with assisted e-commerce model",
    date: "April 28, 2023",
    description: "indypay, India's first integrated omnichannel financial services platform, has successfully gone live on the Open Network for Digital Commerce (ONDC) .... Read more"
  },
  {
    title: "indypay makes strategic foray into the African and Middle East digital-first financial services spac",
    date: "April 13, 2023",
    description: "indypay, India's fast-growing integrated financial services platform, today announced its aggressive overseas growth plans ..... Read more"
  },
  {
    title: "indypay successfully integrates 500+ E-governance services via UMANG on its platform",
    date: "Oct 27, 2022",
    description: "Becomes the first financial services player in the country to empower 600 million Bharat citizens with services ranging from central to local government bodies ..... Read more"
  },
  {
    title: "indypay eyes ONDC network participation; seeks to digitally empower 500,000+ vyaapaaris across India",
    date: "June 29, 2022",
    description: "In line with the Government of India's vision to bring about a digital transformation in the lives of small vyaapaaris and retailers, indypay is set to join the ambitious Open Network for Digital Commerce (ONDC) ..... Read more"
  },
  {
    title: "Rajasthan Government's e-governance project powered by indypay surpasses 15-lakh transactions milestone",
    date: "June 23, 2022",
    description: "Rajasthan Government's e-governance project powered by indypay surpasses 15-lakh transactions milestone"
  }
];

export default function MediaCentrePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="pt-20 pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
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

              <div className="relative w-full max-w-4xl aspect-[3/2]">
                <Image
                  src="/media center/Media Centre.png"
                  alt="Media Centre"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* News Items Section */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Latest News</h2>
              <div className="space-y-6">
                {newsItems.map((item, index) => (
                  <div key={index} className="border-l-4 border-[#7B4DB5] pl-6 py-4 hover:bg-slate-50 transition-colors">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#7B4DB5] font-semibold mb-3">
                      {item.date}
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

