import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-neo-yellow border-2 border-foreground shadow-md rotate-12 animate-float" />
      <div className="absolute top-40 right-20 w-12 h-12 bg-neo-blue border-2 border-foreground shadow-md -rotate-6 animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-40 left-20 w-10 h-10 bg-neo-pink border-2 border-foreground shadow-md rotate-45 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-20 right-10 w-14 h-14 bg-neo-green border-2 border-foreground shadow-md -rotate-12 animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="max-w-5xl mx-auto text-center">
        {/* Main headline */}
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6">
          <span className="block">KILIG</span>
          <span className="block text-neo-yellow" style={{ textShadow: '4px 4px 0px hsl(var(--foreground))' }}></span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl font-bold uppercase tracking-wide mb-4">
          Raw. Bold. Fast.
        </p>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Transform scientific papers into engaging, animated explanatory videos 
          using autonomous AI agents. From research to visualization in minutes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="neo" size="lg" asChild>
            <Link to="/dashboard">
              <Zap className="w-5 h-5 mr-2" />
              Start Creating
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="#features">
              See How It Works
            </Link>
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mt-16 max-w-2xl mx-auto">
          <div className="bg-card border-2 border-foreground p-4 shadow-sm">
            <div className="text-3xl font-bold">10x</div>
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Faster Creation</div>
          </div>
          <div className="bg-neo-blue border-2 border-foreground p-4 shadow-sm">
            <div className="text-3xl font-bold">AI</div>
            <div className="text-sm uppercase tracking-wide">Agents</div>
          </div>
          <div className="bg-card border-2 border-foreground p-4 shadow-sm">
            <div className="text-3xl font-bold">∞</div>
            <div className="text-sm uppercase tracking-wide text-muted-foreground">Possibilities</div>
          </div>
        </div>
      </div>
    </section>
  );
}
