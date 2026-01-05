import { Link, useLocation } from "react-router-dom";
import { Zap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/retroui";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-4 border-black px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-neo-yellow border-4 border-black shadow-sm flex items-center justify-center group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-md transition-all">
              <Zap className="w-6 h-6 fill-black" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">KILIG</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={`px-6 py-2 font-black uppercase text-sm tracking-[0.1em] border-4 transition-all ${
                isActive("/")
                  ? "bg-black text-white border-black"
                  : "border-transparent hover:border-black"
              }`}
            >
              Home
            </Link>
            <Link
              to="/gallery"
              className={`px-6 py-2 font-black uppercase text-sm tracking-[0.1em] border-4 transition-all ${
                isActive("/gallery")
                  ? "bg-black text-white border-black"
                  : "border-transparent hover:border-black"
              }`}
            >
              Gallery
            </Link>
            <Link
              to="/dashboard"
              className={`px-6 py-2 font-black uppercase text-sm tracking-[0.1em] border-4 transition-all ${
                isActive("/dashboard")
                  ? "bg-black text-white border-black"
                  : "border-transparent hover:border-black"
              }`}
            >
              Paper Editor
            </Link>
            <div className="ml-4">
              <Button size="sm" asChild>
                <Link to="/dashboard">Get Started</Link>
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden w-12 h-12 bg-white border-4 border-black flex items-center justify-center hover:bg-neo-blue transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-6 border-t-4 border-black animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-4 font-black uppercase text-lg tracking-widest border-4 ${
                  isActive("/")
                    ? "bg-black text-white border-black shadow-md"
                    : "border-black bg-white shadow-sm"
                }`}
              >
                Home
              </Link>
              <Link
                to="/gallery"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-4 font-black uppercase text-lg tracking-widest border-4 ${
                  isActive("/gallery")
                    ? "bg-black text-white border-black shadow-md"
                    : "border-black bg-white shadow-sm"
                }`}
              >
                Gallery
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-4 font-black uppercase text-lg tracking-widest border-4 ${
                  isActive("/dashboard")
                    ? "bg-black text-white border-black shadow-md"
                    : "border-black bg-white shadow-sm"
                }`}
              >
                Paper Editor
              </Link>
              <Button className="mt-4 h-16 text-xl" asChild>
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