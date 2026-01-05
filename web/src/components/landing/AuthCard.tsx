import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus, Mail, Lock, ArrowRight } from "lucide-react";
import { Button, Input, Card, Text } from "@/components/retroui";
import { useToast } from "@/hooks/use-toast";

export function AuthCard() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: just navigate to dashboard
    toast({
      title: isLogin ? "Welcome back!" : "Account created!",
      description: "Redirecting to your dashboard...",
    });
    navigate("/dashboard");
  };

  return (
    <section className="py-24 px-4 cube-bg">
      <div className="max-w-md mx-auto">
        <Card className="bg-white border-4 border-black shadow-xl p-2">
          <Card.Header className="text-center pb-8 border-b-4 border-black mb-6">
            <Card.Title className="text-3xl flex items-center justify-center gap-3 uppercase italic">
              {isLogin ? <LogIn className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
              {isLogin ? "Login" : "Sign Up"}
            </Card.Title>
            <Text className="text-foreground font-medium mt-2">
              {isLogin ? "Welcome back! Enter your credentials." : "Create your account to get started."}
            </Text>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Text className="text-sm font-bold uppercase tracking-wider ml-1">Email Address</Text>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black z-10" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 border-4 border-black shadow-md focus:shadow-none transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Text className="text-sm font-bold uppercase tracking-wider ml-1">Secret Password</Text>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black z-10" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 border-4 border-black shadow-md focus:shadow-none transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <Button size="lg" className="w-full text-lg h-14 mt-4" type="submit">
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-bold uppercase tracking-widest underline decoration-4 underline-offset-4 hover:text-neo-blue transition-colors"
              >
                {isLogin ? "New here? Create account" : "Back to login"}
              </button>
            </div>

            <div className="mt-10 pt-8 border-t-4 border-black border-dashed">
              <p className="text-xs text-center text-foreground font-black uppercase tracking-[0.2em] mb-6">
                OR
              </p>
          <Button 
            variant="ghost" 
            className="w-full h-14 border-4 border-black font-black uppercase tracking-widest hover:bg-neo-blue/10"
            onClick={() => navigate("/dashboard")}
          >
            Skip to Paper Editor (Demo)
          </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    </section>
  );
}