import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativeApp } from "@/lib/platform";

/**
 * Hook to manage iOS status bar style based on the current theme.
 * Automatically updates when theme changes.
 */
export function useStatusBar() {
  useEffect(() => {
    if (!isNativeApp()) {
      return; // Only run on native apps
    }

    const updateStatusBar = async () => {
      const isDark = document.documentElement.classList.contains("dark");

      try {
        // Set status bar style based on theme
        // Light style = dark text (for light backgrounds)
        // Dark style = light text (for dark backgrounds)
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light,
        });

        // Set background color to match app theme
        // Light mode: #FAFAFC, Dark mode: #0A0A0B (hsl 240 10% 4%)
        await StatusBar.setBackgroundColor({
          color: isDark ? "#0A0A0B" : "#FAFAFC",
        });
      } catch (error) {
        console.error("Error updating status bar:", error);
      }
    };

    // Update on mount
    updateStatusBar();

    // Watch for theme changes via mutation observer on <html> class
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          updateStatusBar();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);
}
