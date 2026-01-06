import { Zap, Github, Twitter, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-white text-black border-t-4 border-black py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-neo-yellow border-4 border-black shadow-sm flex items-center justify-center">
                <Zap className="w-8 h-8 text-black fill-black" />
              </div>
              <span className="text-3xl font-black tracking-tighter uppercase italic">KILIG</span>
            </Link>
            <p className="text-black/80 max-w-sm text-lg font-medium leading-relaxed">
              Transform scientific papers into engaging, animated explanatory videos using AI-powered automation. Built for the modern researcher.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-6">
            <h4 className="font-black uppercase tracking-[0.2em] text-neo-blue">Product</h4>
            <ul className="space-y-4">
              <li>
                <a href="#features" className="text-lg font-bold hover:text-neo-yellow transition-colors flex items-center gap-2">
                  <span className="w-2 h-2 bg-black rotate-45" />
                  Features
                </a>
              </li>
              <li>
                <span className="text-lg font-bold opacity-50 flex items-center gap-2">
                  <span className="w-2 h-2 bg-black rotate-45 opacity-50" />
                  Docs
                </span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-6">
            <h4 className="font-black uppercase tracking-[0.2em] text-neo-pink">Connect</h4>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="w-14 h-14 bg-black text-white border-4 border-black flex items-center justify-center hover:bg-neo-yellow hover:text-black hover:translate-y-[-4px] transition-all"
              >
                <Github className="w-8 h-8" />
              </a>
              <a 
                href="#" 
                className="w-14 h-14 bg-black text-white border-4 border-black flex items-center justify-center hover:bg-neo-blue hover:text-black hover:translate-y-[-4px] transition-all"
              >
                <Twitter className="w-8 h-8" />
              </a>
              <a 
                href="#" 
                className="w-14 h-14 bg-black text-white border-4 border-black flex items-center justify-center hover:bg-neo-pink hover:text-black hover:translate-y-[-4px] transition-all"
              >
                <Mail className="w-8 h-8" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-20 pt-10 border-t-4 border-black/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-lg font-black uppercase tracking-widest text-black/40">
            © {new Date().getFullYear()} KILIG. "the most personal is the most creative"
          </p>
          <div className="flex gap-10">
            <span className="text-lg font-black uppercase tracking-widest text-black/40 cursor-pointer hover:text-black transition-colors">Privacy</span>
            <span className="text-lg font-black uppercase tracking-widest text-black/40 cursor-pointer hover:text-black transition-colors">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}