import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { ChoosePath } from "@/components/choose-path";
import { HowItWorks } from "@/components/how-it-works";
import { ProductDemo } from "@/components/product-demo";
import { ProblemSolution } from "@/components/problem-solution";
import { PrivacyCallout } from "@/components/privacy-callout";
import { Pricing } from "@/components/pricing";
import { Faq } from "@/components/faq";
import { FinalCta } from "@/components/final-cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div id="top">
      <Navbar />
      <main>
        <Hero />
        <ChoosePath />
        <HowItWorks />
        <ProductDemo />
        <ProblemSolution />
        <PrivacyCallout />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
