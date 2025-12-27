import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VaultLogoWithText, VaultLogo } from "@/components/icons/VaultLogo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isNativeApp } from "@/lib/platform";
import { Browser } from "@capacitor/browser";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check for OAuth callback on mount (only when returning from Google OAuth)
  useEffect(() => {
    const checkOAuthCallback = async () => {
      // Only process if this looks like an OAuth callback (has hash with access_token or error)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hasOAuthReturn = hashParams.has("access_token") || hashParams.has("error");

      if (!hasOAuthReturn) {
        return; // Not an OAuth callback, don't auto-redirect
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User just completed OAuth, route them appropriately
        handleSuccessfulAuth();
      }
    };
    checkOAuthCallback();
  }, []);

  const handleSuccessfulAuth = async () => {
    // Check if user has completed subscription and onboarding
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, onboarding_completed_at")
        .eq("user_id", user.id)
        .single();

      const hasSubscription = profile?.subscription_status && profile.subscription_status !== "none";
      const hasCompletedOnboarding = !!profile?.onboarding_completed_at;

      if (!hasSubscription) {
        // No subscription yet -> pricing
        navigate("/pricing", { replace: true });
      } else if (!hasCompletedOnboarding) {
        // Has subscription but didn't finish onboarding -> reset subscription and go to pricing
        // This ensures users must complete the full flow
        await supabase
          .from("profiles")
          .update({
            subscription_status: "none",
            subscription_tier: null,
            trial_ends_at: null,
          })
          .eq("user_id", user.id);
        navigate("/pricing", { replace: true });
      } else {
        // Fully set up -> home
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
            // Supabase returns same error for wrong password and OAuth-only accounts
            // Always hint about Google since we can't distinguish
            toast({
              variant: "destructive",
              title: "Invalid credentials",
              description: "Email or password is incorrect. If you signed up with Google, use the Google button instead.",
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

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    try {
      if (isNativeApp()) {
        // For native apps, use in-app browser with deep link callback
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: "com.gaureshkapoor.vault://auth/callback",
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;

        if (data?.url) {
          // Open OAuth URL in in-app browser
          await Browser.open({ url: data.url });
        }
      } else {
        // For web, use standard redirect
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth`,
          },
        });

        if (error) throw error;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast({
        variant: "destructive",
        title: "Google sign-in failed",
        description: errorMessage,
      });
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setIsForgotPassword(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetOnboarding = async () => {
    setIsLoading(true);

    try {
      let userId: string;

      // Check if already logged in (e.g., via Google OAuth)
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Already logged in - use existing session
        userId = session.user.id;
      } else if (email && password) {
        // Not logged in - try email/password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        userId = data.user.id;
      } else {
        toast({
          variant: "destructive",
          title: "Not logged in",
          description: "Log in with Google or enter email/password to reset.",
        });
        setIsLoading(false);
        return;
      }

      // 2. Delete all user's ideas
      const { error: deleteError } = await supabase
        .from("ideas")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Failed to delete ideas:", deleteError);
      }

      // 3. Insert the 3 default template ideas (matching the DB trigger)
      const templateIdeas = [
        {
          user_id: userId,
          title: "Mood Tracker",
          description: "A mood tracker that uses Spotify listening history to correlate music with emotional states.",
          category: "Health",
          main_idea: "An app that tracks daily moods and automatically pulls Spotify listening data to find patterns between music choices and emotional well-being.",
          core_problem: "People struggle to understand what influences their mood and lack objective data to identify emotional patterns.",
          core_value_proposition: "Discover hidden connections between your music and emotions with automatic mood-music correlation.",
          core_loop: "Log mood → Auto-fetch Spotify data → Show correlations → Weekly insights",
          mvp_shape: "Mobile-first PWA with Spotify OAuth, simple mood logging, and basic correlation charts.",
          target_user: "Music lovers interested in self-improvement and mental wellness",
          difficulty: 2,
          priority: 4,
          sprint_fit: 3,
          status: "idea" as const,
          ai_score: 7.8,
          check_clear_problem: true,
          check_simple_loop: true,
          check_deployable_mvp: true,
          is_template: true,
          sort_order: 1,
        },
        {
          user_id: userId,
          title: "Voice Memo Idea Capture",
          description: "Quick voice-to-text idea capture with AI organization and tagging.",
          category: "Productivity",
          main_idea: "A voice-first app for capturing ideas on the go, with AI transcription and automatic categorization.",
          core_problem: "Great ideas slip away because typing on mobile is slow and inconvenient.",
          core_value_proposition: "Never lose an idea again. Speak it, and AI handles the rest.",
          core_loop: "Record voice → AI transcribes → Auto-tag & organize → Search & review",
          mvp_shape: "Mobile app with voice recording, speech-to-text API, and simple folder organization.",
          target_user: "Entrepreneurs, creatives, and busy professionals",
          difficulty: 2,
          priority: 4,
          sprint_fit: 4,
          status: "idea" as const,
          ai_score: 8.5,
          check_clear_problem: true,
          check_simple_loop: true,
          check_deployable_mvp: true,
          is_template: true,
          sort_order: 2,
        },
        {
          user_id: userId,
          title: "Side Project Tracker",
          description: "Notion-style database for tracking side projects with progress and deadlines.",
          category: "Productivity",
          main_idea: "A streamlined project tracker designed specifically for indie hackers and side project enthusiasts.",
          core_problem: "Side projects get abandoned because there is no simple way to track progress and maintain momentum.",
          core_value_proposition: "Ship more projects by tracking what matters: progress, blockers, and next actions.",
          core_loop: "Add project → Set milestones → Log progress → Review weekly",
          mvp_shape: "Web app with kanban board, simple milestone tracking, and weekly digest emails.",
          target_user: "Indie hackers, developers with side projects, and weekend builders",
          difficulty: 2,
          priority: 4,
          sprint_fit: 4,
          status: "idea" as const,
          ai_score: 8.2,
          check_clear_problem: true,
          check_simple_loop: true,
          check_deployable_mvp: true,
          is_template: true,
          sort_order: 3,
        },
      ];

      const { error: insertError } = await supabase
        .from("ideas")
        .insert(templateIdeas);

      if (insertError) {
        console.error("Failed to insert template ideas:", insertError);
      }

      // 4. Reset onboarding, subscription, and profile fields to null
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed_at: null,
          subscription_status: "none",
          subscription_tier: null,
          trial_ends_at: null,
          user_type: null,
          building_experience: null,
          tools_used: null,
          goals: null,
          weekly_hours: null,
        })
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Reset complete",
        description: "Checking subscription state...",
      });

      await handleSuccessfulAuth();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Reset failed";
      toast({
        variant: "destructive",
        title: "Reset failed",
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
              {isForgotPassword
                ? "Reset your password"
                : isSignUp
                ? "Create your account"
                : "Log in to your account"}
            </h1>

            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
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
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="mt-4 text-sm text-primary hover:underline w-full text-center"
                >
                  Back to login
                </button>
              </form>
            ) : (
            <>
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
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            )}

            <div className="mt-8 space-y-3">
              <Button
                type="button"
                variant="social"
                size="lg"
                className="w-full"
                disabled={isLoading || isGoogleLoading}
                onClick={handleGoogleAuth}
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
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
                )}
                {isGoogleLoading ? "Connecting..." : "Continue with Google"}
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

            {/* Dev Tools - Temporarily enabled outside dev for MVP testing */}
            {/* {import.meta.env.DEV && ( */}
              <div className="mt-8 p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Dev Tools
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleResetOnboarding}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset & Restart Onboarding"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Works with Google login or email/password
                </p>
              </div>
            {/* )} */}
            </>
            )}
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
