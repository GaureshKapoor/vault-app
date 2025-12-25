import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_KEY = "vault-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function getInitialTheme(): "light" | "dark" | "system" {
  if (typeof window === "undefined") return "system";
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return "system";
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<"light" | "dark" | "system">(getInitialTheme);

  useEffect(() => {
    const applyTheme = () => {
      const effectiveTheme = preference === "system" ? getSystemTheme() : preference;
      if (effectiveTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme();

    // Listen for system theme changes if using system preference
    if (preference === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [preference]);

  const toggleTheme = () => {
    const effectiveTheme = preference === "system" ? getSystemTheme() : preference;
    const newTheme = effectiveTheme === "dark" ? "light" : "dark";
    setPreference(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  };

  const isDark = preference === "system" 
    ? getSystemTheme() === "dark" 
    : preference === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-sm border border-primary/20 dark:border-white/20 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-white" />
      ) : (
        <Moon className="w-4 h-4 text-primary" />
      )}
    </button>
  );
}
