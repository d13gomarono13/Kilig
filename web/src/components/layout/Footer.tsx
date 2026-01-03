import { Zap, Github, Twitter, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-neo-yellow border-2 border-background shadow-xs flex items-center justify-center">
                <Zap className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">KILIG</span>
            </Link>
            <p className="text-background/70 max-w-sm">
              Transform scientific papers into engaging, animated explanatory videos using AI-powered automation.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-background/70 hover:text-background transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <a href="#features" className="text-background/70 hover:text-background transition-colors">
                  Features
                </a>
              </li>
              <li>
                <span className="text-background/70">Documentation</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold uppercase tracking-wide mb-4">Connect</h4>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-10 h-10 bg-background text-foreground border-2 border-background flex items-center justify-center hover:bg-neo-yellow transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-background text-foreground border-2 border-background flex items-center justify-center hover:bg-neo-blue transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-background text-foreground border-2 border-background flex items-center justify-center hover:bg-neo-pink transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t-2 border-background/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} Kilig. Raw. Bold. Fast.
          </p>
          <div className="flex gap-6">
            <span className="text-sm text-background/50">Privacy</span>
            <span className="text-sm text-background/50">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
