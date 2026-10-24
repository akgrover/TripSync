import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { ProductDemo } from "@/components/product-demo";
import { ProblemSolution } from "@/components/problem-solution";
import { PrivacyCallout } from "@/components/privacy-callout";
import { FinalCta } from "@/components/final-cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div id="top">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ProductDemo />
        <ProblemSolution />
        <PrivacyCallout />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
