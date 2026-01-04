import { ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/retroui";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 cube-bg border-b-4 border-black overflow-hidden">
      {/* Decorative comic elements - Digital Comic Theme */}
      
      {/* 1. The "Bang" / Explosion */}
      <svg viewBox="0 0 200 200" className="absolute top-20 left-10 w-32 h-32 animate-float hidden md:block" style={{ animationDelay: '0s' }}>
        <path d="M100 10 L120 40 L150 30 L130 60 L160 80 L130 90 L140 120 L100 110 L60 120 L70 90 L40 80 L70 60 L50 30 L80 40 Z" 
              className="fill-neo-yellow stroke-black stroke-[3px] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" 
              transform="scale(1.2) translate(-15, -15)"
        />
      </svg>
      
      {/* 2. The Digital Tablet / Comic Reader */}
      <svg viewBox="0 0 100 100" className="absolute top-32 right-[15%] w-24 h-32 animate-float hidden md:block" style={{ animationDelay: '0.5s' }}>
        {/* Tablet Body */}
        <rect x="15" y="10" width="70" height="80" rx="5" className="fill-white stroke-black stroke-[3px] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" />
        {/* Screen/Panels */}
        <rect x="20" y="15" width="60" height="35" className="fill-neo-blue stroke-black stroke-[2px]" />
        <rect x="20" y="55" width="28" height="30" className="fill-neo-pink stroke-black stroke-[2px]" />
        <rect x="52" y="55" width="28" height="30" className="fill-neo-purple stroke-black stroke-[2px]" />
        {/* Home Button */}
        <circle cx="50" cy="85" r="2" className="fill-black" />
      </svg>

      {/* 3. The Speech Bubble */}
      <svg viewBox="0 0 100 100" className="absolute bottom-40 left-[15%] w-28 h-24 animate-float hidden md:block" style={{ animationDelay: '1s' }}>
        <path d="M10 10 H90 V65 H60 L40 85 L45 65 H10 V10 Z" 
              className="fill-white stroke-black stroke-[3px] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" 
        />
        {/* Halftone dots simulation */}
        <circle cx="25" cy="25" r="2" className="fill-black/20" />
        <circle cx="35" cy="25" r="2" className="fill-black/20" />
        <circle cx="45" cy="25" r="2" className="fill-black/20" />
        <circle cx="25" cy="35" r="2" className="fill-black/20" />
        <circle cx="35" cy="35" r="2" className="fill-black/20" />
        <circle cx="45" cy="35" r="2" className="fill-black/20" />
        
        <text x="50" y="45" textAnchor="middle" className="font-black text-[10px] fill-black uppercase">WOW!</text>
      </svg>

      {/* 4. The "Action" Star/Impact */}
      <svg viewBox="0 0 100 100" className="absolute bottom-20 right-10 w-24 h-24 animate-float hidden md:block" style={{ animationDelay: '1.5s' }}>
        <path d="M50 5 L61 35 L95 35 L68 55 L79 90 L50 70 L21 90 L32 55 L5 35 L39 35 Z" 
              className="fill-neo-green stroke-black stroke-[3px] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" 
        />
      </svg>

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