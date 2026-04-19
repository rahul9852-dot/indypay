const STEPS = [
  {
    step: '01',
    title: 'Sign up & get verified',
    body: 'Create your account, submit business documents, and complete KYC — entirely online. Approval in under 24 hours.',
  },
  {
    step: '02',
    title: 'Integrate in minutes',
    body: 'Pick our plug-and-play SDK, no-code plugin, or raw API. Our sandbox lets you test every payment scenario before going live.',
  },
  {
    step: '03',
    title: 'Go live & grow',
    body: 'Start accepting payments across every channel. Watch real-time analytics, automate settlements, and scale without limits.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div data-aos="fade-up" className="text-center mb-16">
          <p className="text-[#3B5FD4] text-sm font-semibold tracking-widest uppercase mb-3">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-black text-[#1E2A7A]">
            Up and running in 3 steps
          </h2>
        </div>

        <div className="relative">
          {/* Connector line using logo gradient */}
          <div className="hidden md:block absolute top-12 left-[16.5%] right-[16.5%] h-0.5 bg-linear-to-r from-[#3B5FD4] via-[#7B4DB5] to-[#3B5FD4]" />

          <div className="grid md:grid-cols-3 gap-10">
            {STEPS.map((s, i) => (
              <div key={s.step} data-aos="fade-up" data-aos-delay={i * 150} className="text-center">
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-[#1E2A7A] to-[#7B4DB5] text-white mb-6 mx-auto shadow-xl shadow-indigo-500/20">
                  <span className="text-2xl font-black">{s.step}</span>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#6BA3E8]" />
                </div>
                <h3 className="text-[#1E2A7A] font-black text-xl mb-3">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
