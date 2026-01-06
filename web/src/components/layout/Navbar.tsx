import { Link, useLocation } from "react-router-dom";
import { Zap, Menu, X, LogOut, Beaker, BookOpen, Images } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/retroui";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
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
              className={`flex items-center gap-2 px-6 py-2 font-black uppercase text-xs tracking-[0.1em] border-4 transition-all ${
                isActive("/")
                  ? "bg-black text-white border-black"
                  : "border-transparent hover:border-black"
              }`}
            >
              <BookOpen size={16} /> Library
            </Link>
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-6 py-2 font-black uppercase text-xs tracking-[0.1em] border-4 transition-all ${
                isActive("/dashboard")
                  ? "bg-black text-white border-black"
                  : "border-transparent hover:border-black"
              }`}
            >
              <Beaker size={16} /> Laboratory
            </Link>
            <Link
              to="/gallery"
              className={`flex items-center gap-2 px-6 py-2 font-black uppercase text-xs tracking-[0.1em] border-4 transition-all ${
                isActive("/gallery")
                  ? "bg-black text-white border-black"
                  : "border-transparent hover:border-black"
              }`}
            >
              <Images size={16} /> Gallery
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4 ml-6 pl-6 border-l-4 border-black/10">
                <Link to="/profile" className="flex items-center gap-2 group">
                   <img src={user?.avatar} alt={user?.name} className="w-10 h-10 border-2 border-black rounded-full group-hover:shadow-md transition-all" />
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-tighter leading-none group-hover:underline">{user?.name}</span>
                      <button onClick={(e) => { e.preventDefault(); logout(); }} className="text-[9px] font-black uppercase text-red-500 hover:underline flex items-center gap-1">
                         <LogOut size={10} /> Sign Out
                      </button>
                   </div>
                </Link>
              </div>
            ) : (
              <div className="ml-4">
                <Button size="sm" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            )}
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
              {isAuthenticated && (
                <div className="flex items-center gap-4 p-4 border-4 border-black bg-slate-50 mb-2">
                  <img src={user?.avatar} alt={user?.name} className="w-12 h-12 border-2 border-black rounded-full" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black uppercase tracking-widest">{user?.name}</span>
                    <span className="text-[10px] font-bold text-slate-500">{user?.email}</span>
                  </div>
                </div>
              )}
              
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 font-black uppercase text-lg tracking-widest border-4 ${
                  isActive("/")
                    ? "bg-black text-white border-black shadow-md"
                    : "border-black bg-white shadow-sm"
                }`}
              >
                <BookOpen /> Library
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 font-black uppercase text-lg tracking-widest border-4 ${
                  isActive("/dashboard")
                    ? "bg-black text-white border-black shadow-md"
                    : "border-black bg-white shadow-sm"
                }`}
              >
                <Beaker /> Laboratory
              </Link>
              <Link
                to="/gallery"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 font-black uppercase text-lg tracking-widest border-4 ${
                  isActive("/gallery")
                    ? "bg-black text-white border-black shadow-md"
                    : "border-black bg-white shadow-sm"
                }`}
              >
                <Images /> Gallery
              </Link>
              
              {isAuthenticated ? (
                <Button variant="destructive" className="mt-4 h-16 text-xl border-4" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                  <LogOut className="mr-2" /> Sign Out
                </Button>
              ) : (
                <Button className="mt-4 h-16 text-xl border-4" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}