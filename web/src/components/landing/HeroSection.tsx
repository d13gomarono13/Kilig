import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/retroui";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 cube-bg border-b-4 border-black">
      {/* Decorative floating elements with RetroUI styling */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-neo-yellow border-2 border-black shadow-sm rotate-12 animate-float" />
      <div className="absolute top-40 right-20 w-12 h-12 bg-neo-blue border-2 border-black shadow-sm -rotate-6 animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-40 left-20 w-10 h-10 bg-neo-pink border-2 border-black shadow-sm rotate-45 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-20 right-10 w-14 h-14 bg-neo-green border-2 border-black shadow-sm -rotate-12 animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Main headline */}
        <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-6">
          <span className="block">KILIG</span>
          <span className="block text-neo-yellow text-outlined uppercase">Video AI</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-4 bg-black text-white inline-block px-4 py-1">
          Raw. Bold. Fast.
        </p>
        <p className="text-lg md:text-xl text-foreground font-medium max-w-2xl mx-auto mb-10">
          Transform scientific papers into engaging, animated explanatory videos 
          using autonomous AI agents. From research to visualization in minutes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button size="lg" asChild className="text-lg">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Zap className="w-6 h-6 fill-current" />
              Start Creating
              <ArrowRight className="w-6 h-6" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="text-lg bg-white">
            <Link to="#features">
              See How It Works
            </Link>
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-3xl mx-auto">
          <div className="bg-white border-4 border-black p-6 shadow-md hover-lift">
            <div className="text-4xl font-bold">10x</div>
            <div className="text-sm uppercase font-bold tracking-widest mt-2">Faster Creation</div>
          </div>
          <div className="bg-neo-blue border-4 border-black p-6 shadow-md hover-lift">
            <div className="text-4xl font-bold uppercase">Agents</div>
            <div className="text-sm uppercase font-bold tracking-widest mt-2">Autonomous Logic</div>
          </div>
          <div className="bg-white border-4 border-black p-6 shadow-md hover-lift">
            <div className="text-4xl font-bold">∞</div>
            <div className="text-sm uppercase font-bold tracking-widest mt-2">Possibilities</div>
          </div>
        </div>
      </div>
    </section>
  );
}