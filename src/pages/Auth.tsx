import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VaultLogoWithText, VaultLogo } from "@/components/icons/VaultLogo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSuccessfulAuth = async () => {
    // Check if user has completed subscription and onboarding
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, onboarding_completed_at")
        .eq("user_id", user.id)
        .single();

      if (!profile?.subscription_status || profile.subscription_status === "none") {
        navigate("/pricing", { replace: true });
      } else if (!profile?.onboarding_completed_at) {
        navigate("/onboarding/setup", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } else {
      navigate("/pricing", { replace: true });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please enter both email and password.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Account exists",
              description: "This email is already registered. Try logging in instead.",
            });
          } else {
            throw error;
          }
        } else {
          handleSuccessfulAuth();
          toast({
            title: "Account created!",
            description: "Welcome to Vault. Let's build something great.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login")) {
            toast({
              variant: "destructive",
              title: "Invalid credentials",
              description: "Email or password is incorrect.",
            });
          } else {
            throw error;
          }
        } else {
          handleSuccessfulAuth();
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 bg-background relative">
        {/* Back to Home - Top Left */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground/60 hover:text-foreground transition-all duration-300 group z-20"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm font-medium opacity-70 group-hover:opacity-100 transition-opacity duration-300">Back to home</span>
        </button>

        {/* Theme Toggle for mobile */}
        <div className="absolute top-6 right-6 lg:hidden z-20">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-md mx-auto">
          <div className="animate-fade-in">
            <button onClick={() => navigate("/")} className="cursor-pointer mb-12">
              <VaultLogoWithText />
            </button>
            
            <h1 className="text-2xl font-bold text-foreground mb-8">
              {isSignUp ? "Create your account" : "Log in to your account"}
            </h1>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-primary uppercase tracking-wide">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-12 bg-muted border-border text-foreground"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-primary uppercase tracking-wide">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-muted border-border text-foreground pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? "Creating account..." : "Logging in..."}
                  </>
                ) : (
                  isSignUp ? "Sign Up" : "Log In"
                )}
              </Button>
            </form>

            {!isSignUp && (
              <button className="mt-4 text-sm text-primary hover:underline">
                Forgot password?
              </button>
            )}

            <div className="mt-8 space-y-3">
              <Button
                variant="social"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground text-center">
              {isSignUp ? "Already have an account?" : "New to Vault?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-medium hover:underline"
                disabled={isLoading}
              >
              {isSignUp ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Hero Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-b from-slate-900 to-slate-950 items-center justify-center relative overflow-hidden">
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(124, 58, 237, 0.3) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>
        
        {/* Decorative glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/30 blur-[120px] rounded-full" />
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 text-center px-12">
          <VaultLogo size="lg" className="mx-auto mb-8" />
          
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            All Your <span className="text-gradient">Ideas</span>, One Place
          </h2>
          
          <AnimatedFast />
          
          <p className="text-white/80 text-lg mt-6 tracking-wide font-semibold">
            Less chaos. More building.
          </p>
          
          <p className="text-white/60 text-base mt-4 max-w-sm mx-auto italic">
            Vibe-<span className="text-gradient font-semibold text-glow animate-glow-pulse not-italic">ideate</span>
            <Sparkles className="inline w-4 h-4 text-primary ml-1 animate-pulse-soft" />
            {" "}in the world of vibe-coding
          </p>
        </div>
      </div>
    </div>
  );
}

const taglineWords = ["faster", "better", "effortless"];

function AnimatedFast() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % taglineWords.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-14 lg:h-16 flex items-center justify-center mt-2">
      <span
        key={taglineWords[currentWordIndex]}
        className="text-4xl lg:text-5xl font-bold text-gradient italic animate-fade-in"
      >
        {taglineWords[currentWordIndex]}
      </span>
    </div>
  );
}
