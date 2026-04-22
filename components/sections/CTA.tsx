export default function CTA() {
  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div
          data-aos="zoom-in"
          className="relative rounded-3xl bg-slate-50 border-2 border-slate-200 px-8 py-16 overflow-hidden"
        >
          <div className="relative z-10">
            <p className="text-[#7B4DB5] text-sm font-bold tracking-widest uppercase mb-4">Start Today</p>
            <h2 className="text-4xl md:text-5xl font-black text-black mb-5 leading-tight">
              Ready to transform <br className="hidden md:block" />
              your payment experience?
            </h2>
            <p className="text-slate-600 text-lg mb-10 max-w-xl mx-auto font-medium">
              Join thousands of businesses already using our platform. Get started in minutes with no setup fees or hidden charges.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#"
                className="px-8 py-4 bg-[#7B4DB5] text-white text-base font-bold rounded-lg hover:bg-[#6A3BA0] transition-all shadow-lg"
              >
                Create Your Account →
              </a>
              <a
                href="#"
                className="px-8 py-4 border-2 border-slate-300 text-black text-base font-bold rounded-lg hover:bg-white transition-all"
              >
                Contact Sales
              </a>
            </div>

            <p className="mt-6 text-slate-500 text-xs font-medium">
              No credit card required · Secure & Compliant · 24/7 Support
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
