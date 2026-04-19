import Image from "next/image";

const LINKS = {
  Products: ['Accept Payments', 'Send Money', 'Payment Links', 'QR & POS', 'Recurring Billing'],
  Solutions: ['Education', 'Retail', 'Hospitality', 'BFSI', 'Logistics', 'Healthcare'],
  Platform: ['Open API', 'Embedded Finance', 'Financial Inclusion', 'Developer Hub'],
  Company: ['About Us', 'Careers', 'Blog', 'Press Kit', 'Partners'],
  Policies: ['Privacy Policy', 'Terms of Use', 'Grievance Redressal', 'Refund Policy'],
};

export default function Footer() {
  return (
    <footer className="bg-[#0F1A4A] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-14">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="mb-4 inline-block bg-white rounded-xl px-3 py-1.5 shadow-sm">
              <Image
                src="/images/indypay-logo.png"
                alt="IndyPay"
                width={110}
                height={36}
                className="object-contain block"
              />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              India's unified fintech infrastructure. Every payment, every channel, one platform.
            </p>
            <div className="flex gap-3">
              {['𝕏', 'in', 'f'].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#3B5FD4]/50 flex items-center justify-center text-white text-xs font-bold transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading}>
              <p className="text-white font-bold text-sm mb-4">{heading}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-[#6BA3E8] text-sm transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="border-t border-white/10 pt-8 mb-8 flex flex-wrap gap-6">
          <a href="tel:+918000000000" className="flex items-center gap-2 text-slate-400 hover:text-[#6BA3E8] text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            +91 80000 00000
          </a>
          <a href="mailto:support@indypay.in" className="flex items-center gap-2 text-slate-400 hover:text-[#6BA3E8] text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            support@indypay.in
          </a>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} IndyPay Technologies Pvt. Ltd. All rights reserved.</p>
          <p>RBI Licensed Payment Aggregator · PCI DSS Level 1 · ISO 27001 Certified</p>
        </div>
      </div>
    </footer>
  );
}
