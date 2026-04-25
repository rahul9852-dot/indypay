import { SEOConfig, commonKeywords } from './seo';

export const pageMetadata: Record<string, SEOConfig> = {
  // Business Pages
  'business/omni-channel': {
    title: 'Omni Channel Payments',
    description: 'Accept payments across online and offline touchpoints with IndyPay\'s omni-channel payment solutions. Seamless integration for in-store, online, and mobile payments.',
    keywords: [...commonKeywords, 'omni channel payments', 'multi-channel payments', 'unified commerce', 'retail payments'],
    canonical: '/business/omni-channel',
  },
  'business/in-store': {
    title: 'In-Store Payment Solutions',
    description: 'POS and QR code payments for your physical store. Accept all payment methods including UPI, cards, and wallets with IndyPay\'s in-store solutions.',
    keywords: [...commonKeywords, 'POS payments', 'in-store payments', 'QR code payments', 'retail POS', 'tap to pay'],
    canonical: '/business/in-store',
  },
  'business/online': {
    title: 'Online Payment Gateway',
    description: 'Secure payment gateway for website and app checkouts. Accept online payments with easy integration, multiple payment methods, and instant settlements.',
    keywords: [...commonKeywords, 'online payment gateway', 'website payments', 'ecommerce payments', 'checkout integration'],
    canonical: '/business/online',
  },
  'business/pay-later': {
    title: 'Pay Later & EMI Solutions',
    description: 'Offer EMI and Buy Now Pay Later (BNPL) options to improve conversions. Flexible payment plans for your customers with IndyPay.',
    keywords: [...commonKeywords, 'EMI payments', 'BNPL', 'buy now pay later', 'installment payments', 'deferred payments'],
    canonical: '/business/pay-later',
  },
  'business/global-collections': {
    title: 'Global Payment Collections',
    description: 'Collect international payments with ease. Accept payments from customers worldwide with multi-currency support and global payment methods.',
    keywords: [...commonKeywords, 'international payments', 'global collections', 'cross-border payments', 'multi-currency'],
    canonical: '/business/global-collections',
  },
  'business/payouts': {
    title: 'Bulk Payouts & Disbursements',
    description: 'Bulk payouts to vendors, partners, and customers. Automate disbursements with IndyPay\'s payout solutions for businesses.',
    keywords: [...commonKeywords, 'bulk payouts', 'vendor payments', 'disbursements', 'automated payouts', 'mass payments'],
    canonical: '/business/payouts',
  },
  'business/dashboard': {
    title: 'Business Dashboard & Management',
    description: 'One view for payments, settlements, and performance. Manage your business with IndyPay\'s comprehensive dashboard, analytics, and reporting tools.',
    keywords: [...commonKeywords, 'payment dashboard', 'business analytics', 'payment reports', 'settlement tracking'],
    canonical: '/business/dashboard',
  },

  // Solutions Pages
  'solutions/nocode': {
    title: 'No-Code Payment Solutions',
    description: 'Start collecting payments without any integration. Create payment links, invoices, and checkout pages without writing code.',
    keywords: [...commonKeywords, 'no-code payments', 'payment links', 'quick setup', 'instant payments'],
    canonical: '/solutions/nocode',
  },
  'solutions/invoices': {
    title: 'Invoice Payments & Billing',
    description: 'Send invoices with built-in payment links. Streamline your billing process and get paid faster with IndyPay\'s invoice solutions.',
    keywords: [...commonKeywords, 'invoice payments', 'billing software', 'payment invoices', 'accounts receivable'],
    canonical: '/solutions/invoices',
  },
  'solutions/nowpay': {
    title: 'NowPay - Instant Payment Links',
    description: 'Create instant payment links and get paid fast. Share payment links via WhatsApp, SMS, or email and receive payments instantly.',
    keywords: [...commonKeywords, 'instant payments', 'payment links', 'quick payments', 'share and collect'],
    canonical: '/solutions/nowpay',
  },
  'solutions/government-business': {
    title: 'Government Payment Solutions',
    description: 'Compliant payment collections for public services. Secure and transparent payment solutions for government departments and agencies.',
    keywords: [...commonKeywords, 'government payments', 'public sector payments', 'e-governance', 'citizen services'],
    canonical: '/solutions/government-business',
  },
  'solutions/schoolpay': {
    title: 'School Fee Payment Solutions',
    description: 'Fees, admissions, and digital receipts for educational institutions. Simplify fee collection with IndyPay\'s SchoolPay solution.',
    keywords: [...commonKeywords, 'school fee payments', 'education payments', 'tuition fees', 'student payments'],
    canonical: '/solutions/schoolpay',
  },
  'solutions/hotelpay': {
    title: 'Hotel & Restaurant Payments',
    description: 'Bookings, deposits, and add-on payments for hospitality. Contactless payment solutions for hotels and restaurants.',
    keywords: [...commonKeywords, 'hotel payments', 'restaurant payments', 'hospitality payments', 'booking payments'],
    canonical: '/solutions/hotelpay',
  },
  'solutions/healthcarepay': {
    title: 'Healthcare Payment Solutions',
    description: 'OPD/IPD billing and payment reminders for healthcare providers. Streamline medical billing and collections with IndyPay.',
    keywords: [...commonKeywords, 'healthcare payments', 'medical billing', 'hospital payments', 'patient payments'],
    canonical: '/solutions/healthcarepay',
  },
  'solutions/societypay': {
    title: 'Society Maintenance Payments',
    description: 'Maintenance collections and member dues for residential societies. Digital payment solutions for housing societies and RWAs.',
    keywords: [...commonKeywords, 'society payments', 'maintenance collection', 'RWA payments', 'housing society'],
    canonical: '/solutions/societypay',
  },
  'solutions/bfsipay': {
    title: 'BFSI Payment Solutions',
    description: 'Payments tailored for BFSI workflows. Comprehensive payment solutions for banks, financial institutions, and insurance companies.',
    keywords: [...commonKeywords, 'BFSI payments', 'banking payments', 'financial services', 'insurance payments'],
    canonical: '/solutions/bfsipay',
  },

  // Platform Pages
  'platform': {
    title: 'Payment Platform & Infrastructure',
    description: 'A unified stack to launch, manage, and scale payments. Build on IndyPay\'s robust payment infrastructure with APIs, SDKs, and tools.',
    keywords: [...commonKeywords, 'payment platform', 'payment infrastructure', 'payment APIs', 'fintech platform'],
    canonical: '/platform',
  },
  'platform/payments-in-a-box': {
    title: 'Payments in a Box',
    description: 'All the essentials you need to go live quickly. Pre-built payment solutions with everything included for rapid deployment.',
    keywords: [...commonKeywords, 'payment solution', 'ready-made payments', 'quick integration', 'turnkey solution'],
    canonical: '/platform/payments-in-a-box',
  },
  'platform/embedded-finance': {
    title: 'Embedded Finance Solutions',
    description: 'Build financial products directly into your user flows. Embed payments, lending, and financial services into your platform.',
    keywords: [...commonKeywords, 'embedded finance', 'embedded payments', 'financial APIs', 'white-label payments'],
    canonical: '/platform/embedded-finance',
  },
  'platform/cash-management-services': {
    title: 'Cash Management Services',
    description: '360-degree fund flow management for businesses. Comprehensive cash management and treasury solutions.',
    keywords: [...commonKeywords, 'cash management', 'treasury management', 'fund management', 'liquidity management'],
    canonical: '/platform/cash-management-services',
  },
  'platform/cms': {
    title: 'Content Management System',
    description: 'Configure products, pricing, and content without code. Manage your payment offerings with an intuitive CMS.',
    keywords: [...commonKeywords, 'payment CMS', 'product configuration', 'pricing management', 'no-code management'],
    canonical: '/platform/cms',
  },
  'platform/card-in-a-box': {
    title: 'Card Issuance Platform',
    description: 'Issue cards and control spend with policy and limits. Launch prepaid, debit, or credit card programs quickly.',
    keywords: [...commonKeywords, 'card issuance', 'prepaid cards', 'corporate cards', 'card program'],
    canonical: '/platform/card-in-a-box',
  },
  'platform/financial-inclusion': {
    title: 'Financial Inclusion Solutions',
    description: 'Reach underserved users with accessible payment rails. Enable financial inclusion with affordable and accessible payment solutions.',
    keywords: [...commonKeywords, 'financial inclusion', 'inclusive finance', 'accessible payments', 'underserved markets'],
    canonical: '/platform/financial-inclusion',
  },

  // About Pages
  'about': {
    title: 'About IndyPay',
    description: 'Who we are, what we build, and why it matters. Learn about IndyPay\'s mission to simplify payments for businesses across India.',
    keywords: [...commonKeywords, 'about IndyPay', 'company information', 'fintech company', 'payment company India'],
    canonical: '/about',
  },
  'about/culture': {
    title: 'Culture & Values',
    description: 'How we work—principles, practices, and people. Discover IndyPay\'s culture, values, and what makes us unique.',
    keywords: [...commonKeywords, 'company culture', 'work culture', 'values', 'team'],
    canonical: '/about/culture',
  },
  'about/partner-with-us': {
    title: 'Partner with IndyPay',
    description: 'Build together with APIs, programs, and support. Join IndyPay\'s partner ecosystem and grow your business.',
    keywords: [...commonKeywords, 'partnerships', 'partner program', 'API partners', 'business partners'],
    canonical: '/about/partner-with-us',
  },
  'about/media-centre': {
    title: 'Media Centre & Press',
    description: 'News, updates, brand kit, and announcements. Latest news, press releases, and media resources from IndyPay.',
    keywords: [...commonKeywords, 'press releases', 'news', 'media kit', 'announcements'],
    canonical: '/about/media-centre',
  },

  // Developer Hub
  'developer-hub': {
    title: 'Developer Hub & API Documentation',
    description: 'Complete API documentation, SDKs, and developer resources. Build payment solutions with IndyPay\'s developer-friendly APIs.',
    keywords: [...commonKeywords, 'API documentation', 'developer docs', 'payment API', 'SDK', 'integration guide'],
    canonical: '/developer-hub',
  },

  // Policy Pages
  'policies/terms': {
    title: 'Terms of Use',
    description: 'Terms and conditions for using IndyPay services. Read our terms of use and service agreement.',
    keywords: [...commonKeywords, 'terms of use', 'terms and conditions', 'service agreement'],
    canonical: '/policies/terms',
    noindex: true,
  },
  'policies/cookies': {
    title: 'Cookie Policy',
    description: 'How we use cookies and similar technologies. Learn about IndyPay\'s cookie policy and privacy practices.',
    keywords: [...commonKeywords, 'cookie policy', 'privacy', 'data protection'],
    canonical: '/policies/cookies',
    noindex: true,
  },
  'policies/refund': {
    title: 'Refund Policy',
    description: 'Refund and cancellation policy for IndyPay services. Understand our refund terms and procedures.',
    keywords: [...commonKeywords, 'refund policy', 'cancellation policy', 'returns'],
    canonical: '/policies/refund',
    noindex: true,
  },
};
