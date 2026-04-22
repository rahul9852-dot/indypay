import SectionHeader from '@/components/ui/SectionHeader';

const STEPS = [
  {
    step: '01',
    title: 'Create Account',
    body: 'Sign up in minutes with your business details. Quick verification process with minimal documentation required.',
  },
  {
    step: '02',
    title: 'Integrate & Test',
    body: 'Use our simple APIs, SDKs, or plugins to integrate. Test in sandbox environment before going live.',
  },
  {
    step: '03',
    title: 'Start Accepting',
    body: 'Go live and start accepting payments. Monitor transactions in real-time with our powerful dashboard.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          label="How It Works"
          title="Get started in 3 simple steps"
        />

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-[16.5%] right-[16.5%] h-0.5 bg-[#7B4DB5]" />

          <div className="grid md:grid-cols-3 gap-10">
            {STEPS.map((s, i) => (
              <div key={s.step} data-aos="fade-up" data-aos-delay={i * 150} className="text-center">
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#7B4DB5] text-white mb-6 mx-auto shadow-lg">
                  <span className="text-2xl font-black">{s.step}</span>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#7B4DB5]" />
                </div>
                <h3 className="text-black font-black text-xl mb-3">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
