import { HeroSection } from "@/components/landing/HeroSection";
import { ProductDemoSection } from "@/components/landing/ProductDemoSection";
import { CapabilitiesSection } from "@/components/landing/CapabilitiesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { EnterpriseSection } from "@/components/landing/EnterpriseSection";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { FooterSection } from "@/components/landing/FooterSection";

export default function HomePage() {
  return (
    <div className="landing-bg-a">
      <HeroSection />
      <ProductDemoSection />
      <CapabilitiesSection />
      <HowItWorksSection />
      <EnterpriseSection />
      <ArchitectureSection />
      <SocialProofSection />
      <FinalCtaSection />
      <FooterSection />
    </div>
  );
}
