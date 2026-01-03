import { Link, useLocation } from "react-router-dom";
import { Zap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card border-b-2 border-foreground">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-neo-yellow border-2 border-foreground shadow-xs flex items-center justify-center group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-md transition-all">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">KILIG</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/"
              className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 transition-all ${
                isActive("/")
                  ? "bg-foreground text-background border-foreground"
                  : "border-transparent hover:border-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 transition-all ${
                isActive("/dashboard")
                  ? "bg-foreground text-background border-foreground"
                  : "border-transparent hover:border-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Button variant="neo" size="sm" asChild>
              <Link to="/dashboard">Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t-2 border-foreground">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 font-bold uppercase text-sm tracking-wide border-2 ${
                  isActive("/")
                    ? "bg-foreground text-background border-foreground"
                    : "border-foreground"
                }`}
              >
                Home
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 font-bold uppercase text-sm tracking-wide border-2 ${
                  isActive("/dashboard")
                    ? "bg-foreground text-background border-foreground"
                    : "border-foreground"
                }`}
              >
                Dashboard
              </Link>
              <Button variant="neo" className="mt-2" asChild>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
