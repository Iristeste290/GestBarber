import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBadges } from "@/components/landing/TrustBadges";
import { ProblemsSection } from "@/components/landing/ProblemsSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PlansSection } from "@/components/landing/PlansSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <HeroSection />
      <TrustBadges />
      <ProblemsSection />
      <StatsSection />
      <AboutSection />
      <BenefitsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PlansSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
