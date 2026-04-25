'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'How do I integrate IndyPay into my application?',
    a: 'You can integrate IndyPay using our REST APIs, server-side SDKs (Node.js, Python, PHP, Java), or no-code plugins for Shopify, Wix, Zoho, and Fynd. Most integrations take less than a day. Start by creating an account, getting your API keys from the dashboard, and following the quickstart guide.',
  },
  {
    q: 'Do you provide SDKs for different programming languages?',
    a: 'Yes. We provide official SDKs for Node.js, Python, PHP, Java, and Ruby. Each SDK wraps our REST API and handles authentication, retries, and error parsing automatically. Mobile SDKs for iOS and Android are also available for native app integrations.',
  },
  {
    q: 'Is a sandbox environment available for testing?',
    a: 'Absolutely. Every IndyPay account comes with a fully functional sandbox environment. Use test API keys (prefixed with ik_test_) to simulate payments, webhooks, refunds, and failure scenarios without touching real money.',
  },
  {
    q: 'How secure is the IndyPay API?',
    a: 'Extremely secure. All API calls are made over HTTPS with TLS 1.2+. We are PCI DSS Level 1 certified. Sensitive card data is tokenized — your servers never touch raw card numbers. Every webhook payload is signed with HMAC-SHA256 so you can verify it came from IndyPay.',
  },
  {
    q: 'How quickly can I go live in production?',
    a: 'Once your KYC is approved (usually same business day), flip your API keys from test to live and you are accepting real payments. Our activation team is available to help if anything needs review.',
  },
];

export default function DevFaqAccordion() {
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
            <span className={`text-sm font-bold leading-snug ${open === i ? 'text-[#7B4DB5]' : 'text-slate-900'}`}>
              {faq.q}
            </span>
            <span className={`ml-4 shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${open === i ? 'bg-[#7B4DB5]' : 'bg-slate-100'}`}>
              <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open === i ? 'rotate-180 text-white' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-sm text-slate-500 leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
