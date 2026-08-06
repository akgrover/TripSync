import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { ProductDemo } from "@/components/product-demo";
import { ProblemSolution } from "@/components/problem-solution";
import { Roadmap } from "@/components/roadmap";
import { PrivacyCallout } from "@/components/privacy-callout";
import { FinalCta } from "@/components/final-cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div id="top">
      <Navbar />
      <main>
        <Hero />
        <ProductDemo />
        <ProblemSolution />
        <Roadmap />
        <PrivacyCallout />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
