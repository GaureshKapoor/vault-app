import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/platform";

/**
 * Hook to handle deep links for OAuth callbacks in native apps.
 * Listens for URL opens and processes auth tokens from the callback.
 */
export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativeApp()) {
      return; // Only run on native apps
    }

    const handleUrlOpen = async (event: URLOpenListenerEvent) => {
      const url = event.url;

      // Check if this is an OAuth callback
      if (url.startsWith("com.gaureshkapoor.vault://auth/callback")) {
        // Close the in-app browser
        await Browser.close();

        // Extract the hash fragment with tokens
        const hashIndex = url.indexOf("#");
        if (hashIndex !== -1) {
          const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            // Set the session with the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!error) {
              // Successfully authenticated, navigate to check subscription/onboarding
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
                  navigate("/pricing", { replace: true });
                } else if (!hasCompletedOnboarding) {
                  navigate("/pricing", { replace: true });
                } else {
                  navigate("/home", { replace: true });
                }
              } else {
                navigate("/pricing", { replace: true });
              }
            } else {
              console.error("Error setting session:", error);
              navigate("/auth", { replace: true });
            }
          }
        }
      }
    };

    // Add the listener
    App.addListener("appUrlOpen", handleUrlOpen);

    // Cleanup on unmount
    return () => {
      App.removeAllListeners();
    };
  }, [navigate]);
}
