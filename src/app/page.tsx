import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { ChoosePath } from "@/components/choose-path";
import { ForPhotographers } from "@/components/for-photographers";
import { HowItWorks } from "@/components/how-it-works";
import { ProductDemo } from "@/components/product-demo";
import { PrivacyCallout } from "@/components/privacy-callout";
import { Pricing } from "@/components/pricing";
import { Faq } from "@/components/faq";
import { FinalCta } from "@/components/final-cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div id="top" className="bg-dots">
      <Navbar />
      <main>
        <Hero />
        <ForPhotographers />
        <ChoosePath />
        <HowItWorks />
        <ProductDemo />
        <PrivacyCallout />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
