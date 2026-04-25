import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import TrustedMarquee from "@/components/sections/TrustedMarquee";
import Industries from "@/components/sections/Industries";
import Stats from "@/components/sections/Stats";
import Platform from "@/components/sections/Platform";
import HowItWorks from "@/components/sections/HowItWorks";
import Testimonials from "@/components/sections/Testimonials";
import CTA from "@/components/sections/CTA";
import { Metadata } from 'next';
import { generateMetadata as genMeta, commonKeywords } from '@/lib/seo';

export const metadata: Metadata = genMeta({
  title: 'Every Payment. Every Channel. One Platform',
  description: 'IndyPay is India\'s unified fintech infrastructure — accept UPI, cards, wallets, POS and more with a single integration across 22+ banking partners. Simplify payments for your business.',
  keywords: [
    ...commonKeywords,
    'payment gateway India',
    'UPI payment gateway',
    'online payment solutions',
    'POS payments',
    'payment integration',
    'merchant payments',
    'business payments',
    'payment API',
  ],
  canonical: '/',
});

export default function Home() {
  return (
    <>
        <Navbar />
        <main className="flex-1">
        <Hero />
        <TrustedMarquee />
        <Industries />
        <Stats />
        <Platform />
        <HowItWorks />
        <Testimonials />
        <CTA />
        </main>
        <Footer />
 
    </>
  );
}
