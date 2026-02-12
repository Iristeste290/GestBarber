import { lazy, Suspense } from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";

// Lazy load below-the-fold sections
const ProblemsSection = lazy(() => import("@/components/landing/ProblemsSection").then(m => ({ default: m.ProblemsSection })));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection").then(m => ({ default: m.HowItWorksSection })));
const GrowthEngineSection = lazy(() => import("@/components/landing/GrowthEngineSection").then(m => ({ default: m.GrowthEngineSection })));
const MapSection = lazy(() => import("@/components/landing/MapSection").then(m => ({ default: m.MapSection })));
const AIWebsiteSection = lazy(() => import("@/components/landing/AIWebsiteSection").then(m => ({ default: m.AIWebsiteSection })));
const PlansSection = lazy(() => import("@/components/landing/PlansSection").then(m => ({ default: m.PlansSection })));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const FAQSection = lazy(() => import("@/components/landing/FAQSection").then(m => ({ default: m.FAQSection })));
const CTASection = lazy(() => import("@/components/landing/CTASection").then(m => ({ default: m.CTASection })));
const Footer = lazy(() => import("@/components/landing/Footer").then(m => ({ default: m.Footer })));

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <LandingNavbar />
      <HeroSection />
      <Suspense fallback={<div className="min-h-screen" />}>
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
      </Suspense>
    </div>
  );
};

export default LandingPage;
