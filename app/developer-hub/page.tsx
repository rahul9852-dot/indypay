import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactCTAButton from "@/components/ui/ContactCTAButton";
import DevFaqAccordion from "./DevFaqAccordion";
import CodeTabs from "./CodeTabs";

/* ─── Hero terminal mock ────────────────────────────────────────────────── */
const HeroTerminal = () => (
  <div className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/50 border border-slate-700">
    {/* Window chrome */}
    <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
      <span className="w-3 h-3 rounded-full bg-red-500/70" />
      <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
      <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
      <span className="ml-3 text-xs text-slate-400 font-mono">POST /v1/payments — IndyPay API</span>
    </div>

      <pre className="bg-slate-950 text-slate-300 text-xs leading-6 p-5 overflow-x-auto font-mono">{`// ── REQUEST ──────────────────────────────────────
const response = await fetch(
  'https://api.indypay.in/v1/payments',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ik_live_...',
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      amount:   149900,
      currency: 'INR',
      customer: { name: 'Rahul Sharma' },
    }),
  }
);

// ── RESPONSE 200 OK ───────────────────────────────
{
  "id":           "pay_LNkX8nR2mT5qP",
  "status":       "created",
  "amount":       149900,
  "currency":     "INR",
  "checkout_url": "https://checkout.indypay.in/pay_..."
}`}</pre>
  </div>
);

/* ─── Response JSON block ──────────────────────────────────────────────── */
const ResponseBlock = () => (
  <div className="rounded-xl overflow-hidden border border-slate-700">
    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border-b border-slate-700">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      <span className="text-[11px] text-slate-400 font-mono">Response · 200 OK</span>
    </div>
    <pre className="bg-slate-950 text-slate-300 text-xs leading-6 p-4 font-mono overflow-x-auto">{`{
  "id": "pay_LNkX8nR2mT5qP",
  "status": "created",
  "amount": 149900,
  "currency": "INR",
  "checkout_url": "https://checkout.indypay.in/pay_LNkX...",
  "expires_at": "2026-04-25T18:30:00Z",
  "customer": {
    "name": "Rahul Sharma",
    "email": "rahul@example.com"
  }
}`}</pre>
  </div>
);

/* ─── Capability card visual mocks ─────────────────────────────────────── */
const RedirectFlowVisual = () => (
  <div className="bg-slate-950 rounded-xl p-4 border border-slate-700 text-xs font-mono">
    <div className="flex items-center gap-2 mb-3">
      <div className="flex-1 bg-slate-800 rounded px-2 py-1 text-slate-400 truncate">yourstore.com/checkout</div>
      <svg className="w-4 h-4 text-[#7B4DB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <div className="flex-1 bg-[#7B4DB5]/20 border border-[#7B4DB5]/40 rounded px-2 py-1 text-[#c4a8e8] truncate">checkout.indypay.in</div>
    </div>
    <div className="space-y-1.5">
      {['POST /v1/payments → 201 Created', 'Redirect → checkout_url', 'Webhook → payment.success'].map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-400">{l}</span>
        </div>
      ))}
    </div>
  </div>
);

const EmbedCheckoutVisual = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
    <div className="text-[10px] text-slate-400 font-mono mb-2 uppercase tracking-widest">Embedded Checkout</div>
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-[#7B4DB5] px-3 py-2 text-white text-xs font-bold">IndyPay · Secure Checkout</div>
      <div className="p-3 space-y-2">
        <div className="bg-slate-50 rounded px-3 py-2 text-xs text-slate-500 border border-slate-200">UPI ID or QR</div>
        <div className="bg-slate-50 rounded px-3 py-2 text-xs text-slate-500 border border-slate-200">4111 •••• •••• 1111</div>
        <div className="bg-[#7B4DB5] rounded py-2 text-center text-white text-xs font-bold">Pay ₹1,499</div>
      </div>
    </div>
    <div className="mt-2 text-[10px] text-slate-400 text-center">Rendered inside your page · iframe-free</div>
  </div>
);

const SplitPayVisual = () => (
  <div className="bg-slate-950 rounded-xl p-4 border border-slate-700 text-xs font-mono">
    <div className="text-slate-500 mb-2 text-[10px] uppercase tracking-widest">Split Settlement</div>
    {[
      { party: 'Merchant A', pct: '70%', amt: '₹1,049' },
      { party: 'Platform fee', pct: '20%', amt: '₹300' },
      { party: 'Tax & GST', pct: '10%', amt: '₹150' },
    ].map((r) => (
      <div key={r.party} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
        <span className="text-slate-400">{r.party}</span>
        <div className="flex items-center gap-3">
          <span className="text-[#c4a8e8]">{r.pct}</span>
          <span className="text-emerald-400 font-medium">{r.amt}</span>
        </div>
      </div>
    ))}
    <div className="mt-2 pt-2 flex justify-between text-slate-300">
      <span>Total</span><span className="text-emerald-400 font-bold">₹1,499</span>
    </div>
  </div>
);

/* ─── Platform badge ────────────────────────────────────────────────────── */
const PlatformBadge = ({ name, color, initial }: { name: string; color: string; initial: string }) => (
  <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border border-slate-200 hover:border-[#7B4DB5]/30 hover:shadow-sm transition-all">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ background: color }}>{initial}</div>
    <span className="text-sm font-semibold text-slate-700">{name}</span>
  </div>
);

/* ─── Security badge ─────────────────────────────────────────────────────── */
const SecBadge = ({ label, sub }: { label: string; sub: string }) => (
  <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100 hover:border-[#7B4DB5]/25 hover:shadow-md transition-all">
    <div className="text-2xl font-black text-[#7B4DB5] mb-1">{label}</div>
    <div className="text-xs text-slate-500 font-medium">{sub}</div>
  </div>
);

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function DeveloperHubPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">

        {/* ══════════════════════════════════════════════════════════════
            §1 HERO
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative bg-white overflow-hidden border-b border-slate-100">
          {/* Subtle purple glow top-right */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#7B4DB5]/8 blur-[120px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Copy */}
              <div>
                <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full border border-[#7B4DB5]/25 bg-[#7B4DB5]/8 text-[#7B4DB5] text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7B4DB5] animate-pulse" />
                  Developer Hub
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-black text-slate-900 leading-tight tracking-tight mb-5">
                  Build Payments.<br />
                  <span className="text-[#7B4DB5]">Faster.</span>{' '}
                  <span className="text-slate-900">Smarter.</span>
                </h1>

                <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-lg">
                  Production-grade APIs, SDKs for every stack, and no-code plugins for the platforms you already use. Go from zero to live payments in hours — not weeks.
                </p>

                <div className="flex flex-wrap gap-4 mb-10">
                  <ContactCTAButton
                    label="Get API Keys"
                    className="px-7 py-3.5 bg-[#7B4DB5] text-white text-sm font-bold rounded-xl hover:bg-[#6A3BA0] transition-all shadow-lg shadow-[#7B4DB5]/25 hover:-translate-y-0.5"
                  />
                  <a
                    href="#docs"
                    className="px-7 py-3.5 border-2 border-[#7B4DB5]/30 text-[#7B4DB5] text-sm font-semibold rounded-xl hover:bg-[#7B4DB5]/6 hover:border-[#7B4DB5]/50 transition-all"
                  >
                    View Documentation →
                  </a>
                </div>

                {/* Quick stats */}
                <div className="flex flex-wrap gap-8 pt-6 border-t border-slate-100">
                  {[
                    { val: '< 1 day', label: 'Avg. integration time' },
                    { val: '99.99%', label: 'API uptime SLA' },
                    { val: '150ms', label: 'Avg. API response' },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-xl font-black text-slate-900">{s.val}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero code panel */}
              <div>
                <HeroTerminal />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            §2 VALUE PROPS
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'Fast Integration',
                  desc: 'RESTful APIs with predictable responses. One endpoint to create a payment. Done.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                  ),
                  title: 'Scalable APIs',
                  desc: 'Auto-scaling infrastructure. Handle one request or a million — same latency.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                    </svg>
                  ),
                  title: 'Multi-Platform',
                  desc: 'Web, mobile, and server SDKs. Node, Python, PHP, Java, iOS, Android.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'Reliable Infrastructure',
                  desc: '99.99% uptime SLA. Multi-region failover. HMAC-signed webhooks.',
                },
              ].map((p) => (
                <div key={p.title} className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-[#7B4DB5]/20 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#7B4DB5]/10 text-[#7B4DB5] flex items-center justify-center shrink-0">
                    {p.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 mb-1">{p.title}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            §3 GATEWAY CAPABILITIES
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-white" id="capabilities">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">API Capabilities</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">
                Everything You Need to Build Payments
              </h2>
              <p className="text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
                From a simple redirect checkout to fully embedded flows and complex split settlements.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Redirect flow */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden hover:border-[#7B4DB5]/25 hover:shadow-lg transition-all group">
                <div className="p-6 bg-slate-50">
                  <RedirectFlowVisual />
                </div>
                <div className="p-6">
                  <div className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wide mb-3">Redirect Flow</div>
                  <h3 className="text-base font-black text-slate-900 mb-2">Simple Transaction</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Create a payment, redirect to our hosted checkout, and get a webhook on completion. The fastest path to accepting money.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['UPI', 'Cards', 'Wallets', 'EMI'].map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-md bg-[#7B4DB5]/8 text-[#7B4DB5] text-[10px] font-bold border border-[#7B4DB5]/15">{m}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Embedded checkout */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden hover:border-[#7B4DB5]/25 hover:shadow-lg transition-all">
                <div className="p-6 bg-slate-50">
                  <EmbedCheckoutVisual />
                </div>
                <div className="p-6">
                  <div className="inline-block px-2.5 py-1 rounded-full bg-purple-50 text-[#7B4DB5] text-[10px] font-bold uppercase tracking-wide mb-3">Embedded</div>
                  <h3 className="text-base font-black text-slate-900 mb-2">Embedded Checkout</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Mount IndyPay directly inside your page. No redirects, no iframes. Full control over UI with our JS SDK.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['JS SDK', 'React', 'Vue', 'Vanilla'].map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-md bg-[#7B4DB5]/8 text-[#7B4DB5] text-[10px] font-bold border border-[#7B4DB5]/15">{m}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Split payments */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden hover:border-[#7B4DB5]/25 hover:shadow-lg transition-all">
                <div className="p-6 bg-slate-50">
                  <SplitPayVisual />
                </div>
                <div className="p-6">
                  <div className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wide mb-3">Advanced</div>
                  <h3 className="text-base font-black text-slate-900 mb-2">Split Payments & Settlement</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Route a single transaction to multiple accounts with configurable split rules. Perfect for marketplaces.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Marketplaces', 'Platforms', 'Escrow'].map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-md bg-[#7B4DB5]/8 text-[#7B4DB5] text-[10px] font-bold border border-[#7B4DB5]/15">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            §4 INTEGRATION OPTIONS
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">Integrations</p>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">
                  Integrate Your Way
                </h2>
                <p className="text-base text-slate-500 leading-relaxed mb-8">
                  Whether you write code or prefer no-code tools, IndyPay fits your workflow. Pick the integration that matches your stack.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      tag: 'No-Code',
                      color: 'bg-blue-50 text-blue-600',
                      title: 'Platform Plugins',
                      desc: 'One-click install for Shopify, Wix, Zoho, and Fynd. No developer needed.',
                    },
                    {
                      tag: 'Server-Side',
                      color: 'bg-purple-50 text-[#7B4DB5]',
                      title: 'SDKs',
                      desc: 'Official libraries for Node.js, Python, PHP, Java, and Ruby. Handles auth, retries, and errors.',
                    },
                    {
                      tag: 'Frontend',
                      color: 'bg-emerald-50 text-emerald-600',
                      title: 'Inline & JS Checkout',
                      desc: 'Mount the checkout directly on your page with our JavaScript SDK. Two lines of code.',
                    },
                    {
                      tag: 'Mobile',
                      color: 'bg-orange-50 text-orange-600',
                      title: 'iOS & Android SDK',
                      desc: 'Native SDKs optimised for mobile UX, biometric auth, and UPI deeplinks.',
                    },
                  ].map((opt) => (
                    <div key={opt.title} className="flex gap-4 p-5 rounded-xl bg-white border border-slate-200 hover:border-[#7B4DB5]/30 hover:shadow-sm transition-all">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide h-fit shrink-0 ${opt.color}`}>
                        {opt.tag}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-900 mb-0.5">{opt.title}</div>
                        <div className="text-xs text-slate-500 leading-relaxed">{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Platform logos */}
                <div className="mt-8">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-4">No-code platforms</p>
                  <div className="flex flex-wrap gap-3">
                    <PlatformBadge name="Shopify" color="#96BF48" initial="S" />
                    <PlatformBadge name="Wix" color="#0C6EFC" initial="W" />
                    <PlatformBadge name="Fynd" color="#E85A00" initial="F" />
                    <PlatformBadge name="Zoho" color="#E42527" initial="Z" />
                    <PlatformBadge name="Custom" color="#7B4DB5" initial="{ }" />
                  </div>
                </div>
              </div>

              {/* Code snippet */}
              <div className="sticky top-24">
                <CodeTabs />
                <div className="mt-4">
                  <ResponseBlock />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            §5 FULL CODE EXAMPLE
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-slate-950" id="docs">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#c4a8e8] mb-3">API Reference</p>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                  Simple API. Powerful Results.
                </h2>
                <p className="text-base text-slate-400 leading-relaxed mb-8">
                  One endpoint to create a payment. Get back a checkout URL. Done. Our API is designed to be boring in the best way — predictable, versioned, and consistent.
                </p>

                <div className="space-y-4">
                  {[
                    { method: 'POST', path: '/v1/payments', desc: 'Create a payment session' },
                    { method: 'GET', path: '/v1/payments/:id', desc: 'Fetch payment status' },
                    { method: 'POST', path: '/v1/refunds', desc: 'Initiate a refund' },
                    { method: 'GET', path: '/v1/settlements', desc: 'List settlements' },
                    { method: 'POST', path: '/v1/webhooks/verify', desc: 'Verify webhook signature' },
                  ].map((e) => (
                    <div key={e.path} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-[#7B4DB5]/40 transition-all">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono shrink-0 ${e.method === 'GET' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-[#7B4DB5]/30 text-[#c4a8e8]'}`}>
                        {e.method}
                      </span>
                      <code className="text-sm text-slate-300 font-mono flex-1">{e.path}</code>
                      <span className="text-xs text-slate-500 hidden sm:block">{e.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full example */}
              <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-2 text-xs text-slate-400 font-mono">payment-example.js</span>
                </div>
                <pre className="bg-slate-950 text-slate-300 text-xs leading-6 p-5 overflow-x-auto font-mono">{`// 1. Install the SDK
// npm install @indypay/node

const IndyPay = require('@indypay/node');
const client = new IndyPay(process.env.INDYPAY_API_KEY);

// 2. Create a payment
app.post('/create-payment', async (req, res) => {
  const payment = await client.payments.create({
    amount: req.body.amount,   // in paise
    currency: 'INR',
    customer: {
      name:  req.body.name,
      email: req.body.email,
      phone: req.body.phone,
    },
    redirect_url: \`\${process.env.SITE_URL}/success\`,
    webhook_url:  \`\${process.env.SITE_URL}/webhook\`,
    metadata: { order_id: req.body.orderId },
  });

  res.json({ checkout_url: payment.checkout_url });
});

// 3. Handle webhook
app.post('/webhook', (req, res) => {
  const event = client.webhooks.verify(
    req.body,
    req.headers['x-indypay-signature'],
    process.env.WEBHOOK_SECRET
  );

  if (event.type === 'payment.success') {
    // Fulfil order
    fulfillOrder(event.data.metadata.order_id);
  }

  res.sendStatus(200);
});`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            §6 SECURITY
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">Security</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">
                Security Built Into Every Transaction
              </h2>
              <p className="text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
                We handle the hard parts of payment security so you don't have to.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                {
                  icon: '🔒',
                  title: 'TLS 1.3 Encryption',
                  desc: 'All data in transit is encrypted end-to-end. No plaintext. Ever.',
                },
                {
                  icon: '🪙',
                  title: 'Card Tokenization',
                  desc: 'Raw card numbers never touch your servers. We tokenize at the edge.',
                },
                {
                  icon: '✅',
                  title: 'PCI DSS Level 1',
                  desc: 'The highest global certification for payment data security.',
                },
                {
                  icon: '🛡️',
                  title: 'AI Fraud Detection',
                  desc: 'Real-time transaction scoring catches fraud before it hits your account.',
                },
              ].map((s) => (
                <div key={s.title} className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-[#7B4DB5]/20 hover:shadow-md transition-all text-center">
                  <div className="text-4xl mb-4">{s.icon}</div>
                  <h3 className="text-sm font-black text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Badges row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'PCI DSS', sub: 'Level 1' },
                { label: 'TLS 1.3', sub: 'Encrypted' },
                { label: 'HMAC', sub: 'Signed Webhooks' },
                { label: 'RBI', sub: 'Compliant' },
                { label: '99.99%', sub: 'Uptime SLA' },
                { label: '< 150ms', sub: 'API Latency' },
              ].map((b) => <SecBadge key={b.label} label={b.label} sub={b.sub} />)}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            §7 DEVELOPER EXPERIENCE
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-[#f9f5ff]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">Developer Experience</p>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 leading-tight">
                  From first API call to production — in hours
                </h2>
                <p className="text-base text-slate-500 leading-relaxed mb-8">
                  We obsess over developer ergonomics. Clear errors, thorough docs, and a sandbox that mirrors production perfectly.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    step: '01',
                    title: 'Create Account',
                    desc: 'Sign up, complete KYC, and get sandbox API keys in minutes.',
                  },
                  {
                    step: '02',
                    title: 'Explore Sandbox',
                    desc: 'Simulate payments, failures, and refunds. Test every edge case safely.',
                  },
                  {
                    step: '03',
                    title: 'Read the Docs',
                    desc: 'Comprehensive reference, quickstarts, and Postman collections.',
                  },
                  {
                    step: '04',
                    title: 'Go Live',
                    desc: 'Swap to live keys. Zero-downtime cutover. Start collecting.',
                  },
                ].map((s) => (
                  <div key={s.step} className="p-5 rounded-2xl bg-white border border-[#7B4DB5]/15 hover:border-[#7B4DB5]/35 hover:shadow-md transition-all">
                    <div className="text-xs font-black text-[#7B4DB5]/40 mb-2 font-mono">{s.step}</div>
                    <div className="text-sm font-black text-slate-900 mb-1">{s.title}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            §8 FAQ
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-white border-y border-slate-100">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7B4DB5] mb-3">FAQ</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                Developer FAQs
              </h2>
            </div>
            <DevFaqAccordion />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            §9 FINAL CTA
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-24 bg-slate-950 relative overflow-hidden">
          <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-[#7B4DB5]/20 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 w-80 h-80 rounded-full bg-[#3B5FD4]/15 blur-[100px] pointer-events-none" />

          <div className="relative max-w-3xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-[#7B4DB5]/20 border border-[#7B4DB5]/30 text-[#c4a8e8] text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-[#7B4DB5] animate-pulse" />
              Sandbox is free. Go live in minutes.
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-white mb-5 leading-tight">
              Start Building with<br />IndyPay Today
            </h2>

            <p className="text-base text-slate-400 mb-10 leading-relaxed">
              Full sandbox access. No credit card required. Switch to production when you're ready.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <ContactCTAButton
                label="Get API Keys"
                className="px-10 py-4 bg-[#7B4DB5] text-white text-base font-black rounded-xl hover:bg-[#6A3BA0] transition-all shadow-xl shadow-[#7B4DB5]/30 hover:-translate-y-0.5"
              />
              <a
                href="#docs"
                className="px-10 py-4 border-2 border-slate-600 text-slate-300 text-base font-semibold rounded-xl hover:border-[#7B4DB5]/60 hover:text-white transition-all"
              >
                View Docs →
              </a>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Need help? Email us at{' '}
              <a href="mailto:dev@indypay.in" className="text-[#c4a8e8] hover:underline">dev@indypay.in</a>
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
