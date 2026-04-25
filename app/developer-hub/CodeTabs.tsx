'use client';

import { useState } from 'react';

const TABS = ['Node.js', 'Python', 'PHP', 'cURL'] as const;
type Tab = (typeof TABS)[number];

const CODE: Record<Tab, string> = {
  'Node.js': `const IndyPay = require('@indypay/node');
const client = new IndyPay('ik_live_YOUR_KEY');

const payment = await client.payments.create({
  amount: 149900,       // in paise
  currency: 'INR',
  customer: {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+919876543210',
  },
  redirect_url: 'https://yourstore.com/callback',
  webhook_url:  'https://yourstore.com/webhook',
});

console.log(payment.checkout_url);
// → https://checkout.indypay.in/pay_LNkX8nR2mT5qP`,

  Python: `import indypay

client = indypay.Client(api_key="ik_live_YOUR_KEY")

payment = client.payments.create(
    amount=149900,        # in paise
    currency="INR",
    customer={
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "phone": "+919876543210",
    },
    redirect_url="https://yourstore.com/callback",
    webhook_url="https://yourstore.com/webhook",
)

print(payment["checkout_url"])
# → https://checkout.indypay.in/pay_LNkX8nR2mT5qP`,

  PHP: `<?php
require 'vendor/autoload.php';

$client = new \\IndyPay\\Client('ik_live_YOUR_KEY');

$payment = $client->payments->create([
  'amount'       => 149900,
  'currency'     => 'INR',
  'customer'     => [
    'name'  => 'Rahul Sharma',
    'email' => 'rahul@example.com',
    'phone' => '+919876543210',
  ],
  'redirect_url' => 'https://yourstore.com/callback',
  'webhook_url'  => 'https://yourstore.com/webhook',
]);

header('Location: ' . $payment['checkout_url']);`,

  cURL: `curl -X POST https://api.indypay.in/v1/payments \\
  -H "Authorization: Bearer ik_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 149900,
    "currency": "INR",
    "customer": {
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "phone": "+919876543210"
    },
    "redirect_url": "https://yourstore.com/callback",
    "webhook_url": "https://yourstore.com/webhook"
  }'`,
};

export default function CodeTabs() {
  const [active, setActive] = useState<Tab>('Node.js');
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(CODE[active]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
      {/* Tab bar */}
      <div className="flex items-center justify-between bg-slate-800 px-4 border-b border-slate-700">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                active === t
                  ? 'border-[#7B4DB5] text-[#c4a8e8]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <pre className="bg-slate-950 text-slate-300 text-xs leading-6 p-5 overflow-x-auto font-mono">
        <code>{CODE[active]}</code>
      </pre>
    </div>
  );
}
