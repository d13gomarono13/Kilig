import { Link, useLocation } from "react-router-dom";
import { Zap, Menu, LogOut, Microscope, BookOpen, Images, User, HelpCircle } from "lucide-react";
import { Button } from "@/components/retroui";
import { useAuth } from "@/lib/auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, children }: { to: string, icon: any, children: React.ReactNode }) => (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-3 font-black uppercase text-base tracking-wider border-4 transition-all ${
        isActive(to)
          ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
          : "bg-white border-transparent hover:border-black hover:bg-slate-50"
      }`}
    >
      <Icon size={20} className="shrink-0 min-w-[20px]" /> {children}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-4 border-black px-4 py-2">
      <div className="max-w-7xl mx-auto relative">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex items-center gap-4 z-10">
            {/* Sidebar Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" className="border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] border-r-4 border-black p-0 bg-yellow-400">
                <div className="flex flex-col h-full bg-white ml-2 mt-2 border-l-4 border-t-4 border-black p-6 gap-6 overflow-y-auto no-scrollbar">
                  {/* Sidebar Brand */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-neo-yellow border-4 border-black shadow-sm flex items-center justify-center">
                      <Zap className="w-6 h-6 fill-black" />
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase">KILIG</span>
                  </div>

                  {/* Navigation */}
                  <div className="flex flex-col gap-4">
                    <NavLink to="/" icon={HelpCircle}>How it works</NavLink>
                    <NavLink to="/library" icon={BookOpen}>Library</NavLink>
                    <NavLink to="/laboratory" icon={Microscope}>Laboratory</NavLink>
                    <NavLink to="/gallery" icon={Images}>Gallery</NavLink>
                  </div>

                  {/* User Section at bottom of sidebar */}
                  <div className="mt-auto border-t-4 border-black pt-6 flex items-center justify-between gap-4">
                    {isAuthenticated ? (
                       <>
                         <Link to="/profile" className="flex items-center gap-3 group flex-1">
                           <img src={user?.avatar} alt={user?.name} className="w-12 h-12 border-2 border-black rounded-full" />
                           <div className="flex flex-col">
                              <span className="text-sm font-black uppercase tracking-tighter">{user?.name}</span>
                              <span className="text-xs text-slate-500 font-bold">View Profile</span>
                           </div>
                         </Link>
                         <button 
                           onClick={(e) => { e.preventDefault(); logout(); }} 
                           className="p-3 border-4 border-black bg-white hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                         >
                            <LogOut size={20} />
                         </button>
                       </>
                    ) : (
                      <Button className="w-full border-4 border-black" asChild>
                        <Link to="/login">Sign In</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Centered Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <Link to="/" className="flex flex-col items-center group">
              <span className="text-3xl font-black tracking-tighter uppercase leading-none">KILIG</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">The most personal is the most creative</span>
            </Link>
          </div>

          {/* Right Side: Auth Actions */}
          <div className="flex items-center gap-4 z-10">
            {!isAuthenticated && (
              <Link to="/login">
                <Button className="bg-white text-black border-4 border-black hover:bg-neo-yellow transition-all shadow-[4px_4px_0px_0px_black] rounded-none font-black uppercase px-6">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}