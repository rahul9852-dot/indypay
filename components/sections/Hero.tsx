'use client';

import { useEffect, useRef } from 'react';

const BADGES = ['UPI', 'Visa', 'Mastercard', 'RuPay', 'IMPS', 'NEFT', 'NetBanking', 'Wallets'];

export default function Hero() {
  const vantaRef = useRef<HTMLElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const THREE = await import('three');
      const VANTA = (await import('vanta/dist/vanta.waves.min')).default;
      if (!mounted || !vantaRef.current || vantaEffect.current) return;
      vantaEffect.current = VANTA({
        el: vantaRef.current,
        THREE,
        color: 0x1E2A7A,   /* brand navy */
        shininess: 55,
        waveHeight: 18,
        waveSpeed: 0.55,
        zoom: 0.85,
      });
    })();
    return () => {
      mounted = false;
      vantaEffect.current?.destroy();
      vantaEffect.current = null;
    };
  }, []);

  return (
    <section
      ref={vantaRef}
      className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden"
    >
      {/* Gradient overlay — navy → blue → purple, matching logo gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-[#0F1A4A]/85 via-[#3B5FD4]/40 to-[#7B4DB5]/55 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Pill */}
        <div
          data-aos="fade-down"
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/80 text-sm font-medium"
        >
          <span className="w-2 h-2 rounded-full bg-[#6BA3E8] animate-pulse" />
          India's #1 Unified Fintech Infrastructure
        </div>

        <h1
          data-aos="fade-up"
          data-aos-delay="100"
          className="text-5xl md:text-7xl font-black text-white leading-[1.08] tracking-tight mb-6"
        >
          Every Payment.{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#6BA3E8] to-[#7B4DB5]">
            Every Channel.
          </span>
          <br />One Platform.
        </h1>

        <p
          data-aos="fade-up"
          data-aos-delay="200"
          className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          IndyPay connects merchants, banks, and consumers across India's entire payment ecosystem —
          from UPI to cards, POS to eCommerce — in a single, powerful integration.
        </p>

        {/* CTAs */}
        <div data-aos="fade-up" data-aos-delay="300" className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <a
            href="#contact"
            className="px-8 py-4 bg-[#7B4DB5] text-white text-base font-bold rounded-xl hover:bg-[#6A3BA0] transition-all shadow-xl shadow-purple-600/30"
          >
            Start for Free →
          </a>
          <a
            href="#solutions"
            className="px-8 py-4 border-2 border-white/30 text-white text-base font-semibold rounded-xl hover:bg-white/10 transition-all backdrop-blur"
          >
            Explore Solutions
          </a>
        </div>

        {/* Payment method badges */}
        <div data-aos="fade-up" data-aos-delay="400" className="flex flex-wrap justify-center gap-2">
          {BADGES.map((b) => (
            <span
              key={b}
              className="px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/80 text-xs font-medium"
            >
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 text-xs animate-bounce">
        <span>scroll</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
