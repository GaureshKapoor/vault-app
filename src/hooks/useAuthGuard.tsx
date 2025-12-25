import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AuthGuardState {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSubscription: boolean;
  hasCompletedOnboarding: boolean;
}

export function useAuthGuard() {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthGuardState>({
    isLoading: true,
    isAuthenticated: false,
    hasSubscription: false,
    hasCompletedOnboarding: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setState({
            isLoading: false,
            isAuthenticated: false,
            hasSubscription: false,
            hasCompletedOnboarding: false,
          });
          navigate("/auth", { replace: true });
          return;
        }

        // Get profile to check subscription and onboarding status
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_status, onboarding_completed_at")
          .eq("user_id", user.id)
          .single();

        const hasSubscription = profile?.subscription_status && profile.subscription_status !== "none";
        const hasCompletedOnboarding = !!profile?.onboarding_completed_at;

        // Redirect based on state
        if (!hasSubscription) {
          navigate("/pricing", { replace: true });
        } else if (!hasCompletedOnboarding) {
          navigate("/onboarding/setup", { replace: true });
        }

        setState({
          isLoading: false,
          isAuthenticated: true,
          hasSubscription: !!hasSubscription,
          hasCompletedOnboarding,
        });
      } catch (error) {
        console.error("Auth guard error:", error);
        setState({
          isLoading: false,
          isAuthenticated: false,
          hasSubscription: false,
          hasCompletedOnboarding: false,
        });
        navigate("/auth", { replace: true });
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return state;
}