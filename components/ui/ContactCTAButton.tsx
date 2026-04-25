'use client';

import { useContactDrawer } from './ContactDrawerContext';

interface Props {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

const BASE = 'inline-block text-center font-bold transition-all duration-200 cursor-pointer';

const VARIANTS = {
  primary:
    'px-8 py-3.5 bg-[#7B4DB5] text-white rounded-xl hover:bg-[#6A3BA0] shadow-lg shadow-[#7B4DB5]/25 hover:shadow-[#7B4DB5]/45 hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'px-8 py-3.5 border-2 border-[#7B4DB5]/30 text-[#7B4DB5] rounded-xl hover:bg-[#7B4DB5]/6 hover:border-[#7B4DB5]/50 bg-white/60 backdrop-blur',
  ghost:
    'text-sm text-slate-700 hover:text-[#7B4DB5]',
};

export default function ContactCTAButton({ label, variant = 'primary', className = '' }: Props) {
  const { openDrawer } = useContactDrawer();
  return (
    <button
      onClick={openDrawer}
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
    >
      {label}
    </button>
  );
}
