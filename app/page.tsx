import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Industries from "@/components/sections/Industries";
import Stats from "@/components/sections/Stats";
import Platform from "@/components/sections/Platform";
import HowItWorks from "@/components/sections/HowItWorks";
import Testimonials from "@/components/sections/Testimonials";
import CTA from "@/components/sections/CTA";

export default function Home() {
  return (
    <>
        <Navbar />
        <main className="flex-1">
        <Hero />
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
