'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'Do I need any coding knowledge to get started?',
    a: 'None at all. IndyPay is built for businesses, not developers. Copy a single snippet or click a plugin button — your checkout is live in minutes.',
  },
  {
    q: 'Which platforms does IndyPay support?',
    a: 'IndyPay works with Shopify, Wix, Fynd, Zoho Commerce, and any custom-built website. If you can embed a script or install a plugin, you are ready to go.',
  },
  {
    q: 'How quickly can I start accepting payments?',
    a: 'Most businesses go live within the same day. Complete KYC verification, connect your platform, and your checkout is ready to collect payments.',
  },
  {
    q: 'Is IndyPay secure for my customers?',
    a: 'Yes. Every transaction is protected with 256-bit AES encryption, PCI DSS Level 1 compliance, and real-time fraud monitoring — the same standard used by leading banks.',
  },
  {
    q: 'What payment methods will my customers be able to use?',
    a: 'UPI, credit and debit cards, net banking, wallets, EMI, and Buy Now Pay Later (BNPL). Your customers can pay the way they prefer.',
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className={`rounded-xl border transition-all duration-200 ${
            open === i
              ? 'border-[#7B4DB5]/40 bg-[#7B4DB5]/4 shadow-sm'
              : 'border-slate-200 bg-white hover:border-[#7B4DB5]/25'
          }`}
        >
          <button
            className="w-full flex items-center justify-between px-6 py-5 text-left"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className={`text-base font-bold leading-snug ${open === i ? 'text-[#7B4DB5]' : 'text-slate-900'}`}>
              {faq.q}
            </span>
            <span className={`ml-4 shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${open === i ? 'bg-[#7B4DB5]' : 'bg-slate-100'}`}>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${open === i ? 'rotate-180 text-white' : 'text-slate-600'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
