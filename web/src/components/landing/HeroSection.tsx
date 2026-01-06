import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/retroui";

export function HeroSection() {
  console.log("Rendering HeroSection...");
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 cube-bg border-b-4 border-black overflow-hidden">
      {/* Top Right Sign In */}
      <div className="absolute top-8 right-8 z-20">
        <Link to="/login">
          <Button className="bg-white text-black border-4 border-black hover:bg-neo-yellow transition-all shadow-[4px_4px_0px_0px_black] rounded-none font-black uppercase">
            Sign In
          </Button>
        </Link>
      </div>
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Main headline */}
        <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-6">
          <span className="block">KILIG</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl font-bold mb-4 bg-black text-white inline-block px-6 py-2 italic uppercase tracking-tight">
          "The most personal is the most creative"
        </p>
        <p className="text-lg md:text-xl text-foreground font-medium max-w-2xl mx-auto mb-10">
          Transform scientific papers into engaging, animated explanatory videos 
          using autonomous AI agents. From research to visualization in minutes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link to="/laboratory">
            <Button size="lg" className="bg-neo-blue text-black border-4 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shadow-[4px_4px_0px_0px_black] rounded-none font-black uppercase text-xl h-16 px-8 flex items-center gap-3">
              <Zap className="w-6 h-6 fill-black" />
              Start Creating
            </Button>
          </Link>
          <Link to="#features">
            <Button variant="outline" size="lg" className="text-lg bg-white border-4 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shadow-[4px_4px_0px_0px_black] rounded-none font-black uppercase h-16 px-8">
              See How It Works
            </Button>
          </Link>
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