import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <section className="py-20 px-4">
      <div className="max-w-md mx-auto">
        <Card variant="elevated" className="bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              {isLogin ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              {isLogin ? "Login" : "Sign Up"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "Welcome back! Enter your credentials." : "Create your account to get started."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 border-2 border-foreground shadow-xs"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 border-2 border-foreground shadow-xs"
                  required
                />
              </div>
              <Button variant="neo" className="w-full" type="submit">
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-medium underline underline-offset-4 hover:text-neo-blue"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-foreground">
              <p className="text-xs text-center text-muted-foreground uppercase tracking-wide">
                Or continue without account
              </p>
              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={() => navigate("/dashboard")}
              >
                Skip to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
