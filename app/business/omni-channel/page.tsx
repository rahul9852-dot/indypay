import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MobileMockup, MobileLandscapeMockup } from "@/components/ui/DeviceMockup";

export default function OmniChannelPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* All Sections Container - No separate hero */}
        <section className="pt-20 pb-12 bg-white">
          <div className="max-w-7xl mx-auto px-6 space-y-24">
            
            {/* Online Payments */}
            <div data-aos="fade-up">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left - Content */}
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-black">Online Payments</h3>
                  </div>

                  <p className="text-base font-normal text-slate-700 mb-4">
                    A top-tier digital payment platform that enables you to accept payments from consumers all around the world
                  </p>

                  <p className="text-sm text-slate-600 mb-8 font-normal leading-relaxed">
                    Your customers can choose from a variety of payment instruments and banks in their country on our platform.
                  </p>

                  <a
                    href="#"
                    className="inline-block px-7 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Get it Now
                  </a>
                </div>

                {/* Right - Image Placeholder */}
                <div className="flex items-center justify-center">
                  <MobileLandscapeMockup label="Online Payments Dashboard" />
                </div>
              </div>
            </div>

            {/* Mobile Payments */}
            <div data-aos="fade-up">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left - Image Placeholder */}
                <div className="flex items-center justify-center">
                  <MobileMockup label="Mobile Payments App" />
                </div>

                {/* Right - Content */}
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-black">Mobile Payments</h3>
                  </div>

                  <p className="text-base font-normal text-slate-700 mb-4">
                    Our mobile solutions are built on strong domain expertise and offer end-to-end service.
                  </p>

                  <p className="text-sm text-slate-600 mb-8 font-normal leading-relaxed">
                    Our mobile capabilities complement our online features to provide your customers with the greatest possible experience
                  </p>

                  <a
                    href="#"
                    className="inline-block px-7 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Get it Now
                  </a>
                </div>
              </div>
            </div>

            {/* Call Centre */}
            <div data-aos="fade-up">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left - Content */}
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-black">Call Centre</h3>
                  </div>

                  <p className="text-base font-normal text-slate-700 mb-4">
                    Accept payments through Call Centre/IVR
                  </p>

                  <p className="text-sm text-slate-600 mb-8 font-normal leading-relaxed">
                    Our PCI DSS Compliant Call Centre/IVR Solution allows you to collect payments from customers over the phone
                  </p>

                  <a
                    href="#"
                    className="inline-block px-7 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Get it Now
                  </a>
                </div>

                {/* Right - Image Placeholder */}
                <div className="flex items-center justify-center">
                  <MobileLandscapeMockup label="Call Centre Dashboard" />
                </div>
              </div>
            </div>

            {/* In-store */}
            <div data-aos="fade-up">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left - Image Placeholder */}
                <div className="flex items-center justify-center">
                  <MobileMockup label="In-store POS App" />
                </div>

                {/* Right - Content */}
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-black">In-store</h3>
                  </div>

                  <p className="text-base font-normal text-slate-700 mb-8">
                    One QR code for all payments, EDC/POS, Tap@ Phone, mPOS, Consumer Loans, Buy Now Pay Later and Card EMI
                  </p>

                  <a
                    href="#"
                    className="inline-block px-7 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Get it Now
                  </a>
                </div>
              </div>
            </div>

            {/* Door-to-door */}
            <div data-aos="fade-up">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left - Content */}
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-black">Door-to-door</h3>
                  </div>

                  <p className="text-base font-normal text-slate-700 mb-4">
                    Convert your phone into a POS machine. With our mPOS solution, you can accept card payments at any time and from any location
                  </p>

                  <p className="text-sm text-slate-600 mb-8 font-normal leading-relaxed">
                    Our mPOS solutions allow you to provide customers with a faster and more convenient option to transact outside of the store
                  </p>

                  <a
                    href="#"
                    className="inline-block px-7 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Get it Now
                  </a>
                </div>

                {/* Right - Image Placeholder */}
                <div className="flex items-center justify-center">
                  <MobileMockup label="mPOS Mobile App" />
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
