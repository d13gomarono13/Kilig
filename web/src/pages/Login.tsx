import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, ShieldCheck, Mail, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginAsGuest, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Removed auto-redirect to allow users to see the login page logic
  // React.useEffect(() => {
  //   if (isAuthenticated) {
  //     navigate('/landing');
  //   }
  // }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    try {
      await login(email);
      navigate('/landing');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/landing');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] p-8 relative overflow-hidden">
        
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-yellow-400 rounded-full mb-4 border-4 border-black">
                <Zap size={32} fill="currentColor" />
            </div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-2">KILIG</h1>
            <p className="font-bold text-slate-600 uppercase tracking-widest text-xs">The ArXiv Library</p>
        </div>

        {isAuthenticated ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="font-black uppercase text-sm">Welcome back,</p>
              <div className="flex items-center justify-center gap-3 p-4 bg-yellow-50 border-4 border-black">
                <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full border-2 border-black" />
                <div className="text-left">
                  <p className="font-bold text-sm">{user?.name}</p>
                  <p className="text-xs text-slate-500 font-bold">{user?.email}</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/landing')}
              className="w-full h-14 bg-black text-white hover:bg-slate-900 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all text-xl font-black uppercase italic group"
            >
              Enter Library
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button 
              onClick={() => logout()}
              variant="outline"
              className="w-full h-10 border-4 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black uppercase text-sm"
            >
              Sign Out
            </Button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-black uppercase text-xs tracking-widest">Scientific Identifier (Email)</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="researcher@kilig.science" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-4 border-black font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-yellow-50 transition-colors"
                  required
                />
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-14 bg-black text-white hover:bg-slate-900 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all text-xl font-black uppercase italic group"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Enter the Library
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="relative flex items-center justify-center">
               <div className="absolute inset-0 border-t-2 border-slate-200"></div>
               <span className="relative bg-white px-2 text-[10px] font-bold uppercase text-slate-400">Or</span>
            </div>

            <Button 
              type="button" 
              onClick={handleGuestLogin}
              variant="outline"
              className="w-full h-10 border-4 border-slate-300 text-slate-500 hover:border-black hover:text-black hover:bg-white transition-all font-black uppercase text-sm"
            >
              Enter as Guest
            </Button>
          </div>
        </form>
        )}

        <div className="mt-8 pt-6 border-t-4 border-black border-dashed flex items-center justify-center gap-6 opacity-60">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter">
                <ShieldCheck size={14} /> Encrypted
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter">
                <Zap size={14} /> AI-Powered
            </div>
        </div>

        {/* Comic-style background text */}
        <div className="absolute -bottom-10 -right-10 text-9xl font-black text-slate-100 -z-10 select-none opacity-50">
            LOG
        </div>
      </div>
    </div>
  );
};

export default Login;
