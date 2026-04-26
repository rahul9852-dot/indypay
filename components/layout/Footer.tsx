import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = {
  Business: [
    { label: 'Accept Payment', href: '/business/omni-channel' },
    { label: 'Omni Channel', href: '/business/omni-channel' },
    { label: 'In Store', href: '/business/in-store' },
    { label: 'Online', href: '/business/online' },
    { label: 'Pay Later', href: '/business/pay-later' },
    { label: 'Global Collections', href: '/business/global-collections' },
    { label: 'Make Payments', href: '/business/payouts' },
    { label: 'Manage your business', href: '/business/dashboard' },
  ],
  Solutions: [
    { label: 'pay later', href: '/business/pay-later' },
    { label: 'government', href: '/solutions/government-business' },
    { label: 'business', href: '/solutions/government-business' },
    { label: 'schoolpay', href: '/solutions/schoolpay' },
    { label: 'hotelpay', href: '/solutions/hotelpay' },
    { label: 'societypay', href: '/solutions/societypay' },
    { label: 'bfsipay', href: '/solutions/bfsipay' },
    { label: 'healthcarepay', href: '/solutions/healthcarepay' },
    { label: 'invoicepay', href: '/solutions/invoices' },
    { label: 'nowpay', href: '/solutions/nowpay' },
  ],
  Platform: [
    { label: 'no-code', href: '/platform/cms' },
    { label: 'wix', href: '#' },
    { label: 'shopify', href: '#' },
    { label: 'dash checkout', href: '#' },
    { label: 'Fynd', href: '#' },
    { label: 'Zoho', href: '#' },
    { label: 'Pay by Link', href: '/solutions/pay-by-link' },
    { label: 'invoicepay', href: '/solutions/invoices' },
  ],
  'Developer Hub': [
    { label: 'About indypay', href: '/about' },
    { label: 'Culture', href: '/about/culture' },
    { label: 'Partner with us', href: '/about/partner-with-us' },
    { label: 'Media Centre', href: '/about/media-centre' },
  ],
  Company: [
    { label: 'About indypay', href: '/about' },
    { label: 'Culture', href: '/about/culture' },
    { label: 'Partner with us', href: '/about/partner-with-us' },
    { label: 'Media Centre', href: '/about/media-centre' },
  ],
  Policies: [
    { label: 'Customer Grievances', href: '#' },
    { label: 'Merchant Onboarding', href: '#' },
    { label: 'Fraud Alert', href: '#' },
    { label: 'Terms & Conditions', href: '/policies/terms' },
    { label: 'Privacy Policy', href: '/policies/cookies' },
    { label: 'Refund Policy', href: '/policies/refund' },
  ],
  'Contact Us': [
    { label: 'Customer Care Number:', href: '#', isHeading: true },
    { label: '020-691-10300 / customerservice@indypay.co.in', href: 'mailto:customerservice@indypay.co.in' },
    { label: 'Enterprise Support: Customer Grievance Reporting', href: '#' },
    { label: 'Vyaapaar Support: Customer Grievance Reporting', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-x-8 gap-y-10 mb-12">
          {Object.entries(FOOTER_LINKS).map(([heading, items]) => (
            <div key={heading}>
              <h3 className="text-[#6B46C1] font-semibold text-sm mb-4">{heading}</h3>
              <ul className="space-y-2.5">
                {items.map((item, idx) => (
                  <li key={idx}>
                    {item.href.startsWith('#') || item.href.startsWith('mailto:') ? (
                      <a 
                        href={item.href} 
                        className={`text-gray-600 hover:text-[#6B46C1] text-[13px] transition-colors block ${
                          item.isHeading ? 'font-medium' : ''
                        }`}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link 
                        href={item.href} 
                        className="text-gray-600 hover:text-[#6B46C1] text-[13px] transition-colors block"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Address Section */}
        <div className="border-t border-gray-100 pt-8 pb-8">
          <div className="text-gray-600 text-sm leading-relaxed">
            <p className="font-semibold text-[#6B46C1] mb-2">Registered Office Address:</p>
            <p>BHIVE Platinum Church Street, 48, Church St, Haridevpur,</p>
            <p>Shanthala Nagar, Bengaluru, Karnataka 560001, India</p>
            <p className="mt-2">Certificate No. IN-KA85327722319802W</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            Copyright © {new Date().getFullYear()} indypay payment services. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <Image
              src="/indypay.svg"
              alt="Made in India"
              width={100}
              height={30}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
