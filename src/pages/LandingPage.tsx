import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemsSection } from "@/components/landing/ProblemsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { GrowthEngineSection } from "@/components/landing/GrowthEngineSection";
import { MapSection } from "@/components/landing/MapSection";
import { AIWebsiteSection } from "@/components/landing/AIWebsiteSection";
import { PlansSection } from "@/components/landing/PlansSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <LandingNavbar />
      <HeroSection />
      <ProblemsSection />
      <HowItWorksSection />
      <GrowthEngineSection />
      <MapSection />
      <AIWebsiteSection />
      <PlansSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
