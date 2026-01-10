import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureCards } from "@/components/landing/FeatureCards";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-yellow-400 cube-bg">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeatureCards />
      </main>
      <Footer />
    </div>
  );
};

export default Index;