import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    ogImage = '/images/indypay-og.png',
    canonical,
    noindex = false,
  } = config;

  const fullTitle = `${title} | IndyPay`;
  const baseUrl = 'https://indypay.in';

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'IndyPay' }],
    creator: 'IndyPay',
    publisher: 'IndyPay',
    robots: noindex ? 'noindex, nofollow' : 'index, follow',
    alternates: canonical ? { canonical: `${baseUrl}${canonical}` } : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url: canonical ? `${baseUrl}${canonical}` : baseUrl,
      siteName: 'IndyPay',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: '@indypay',
    },
    verification: {
      google: 'your-google-verification-code',
    },
  };
}

// Common keywords for all pages
export const commonKeywords = [
  'IndyPay',
  'payment gateway',
  'India payments',
  'UPI payments',
  'digital payments',
  'fintech',
  'payment solutions',
  'online payments',
  'payment processing',
];
