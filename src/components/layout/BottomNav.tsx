import { NavLink, useLocation } from "react-router-dom";
import { Home, Inbox, BarChart3, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { VaultLogo } from "@/components/icons/VaultLogo";

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/inbox", icon: Inbox, label: "Inbox" },
  { path: "/ai", icon: "vault", label: "AI" },
  { path: "/progress", icon: BarChart3, label: "Progress" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="sticky bottom-0 z-50 w-full bg-card/95 border-t border-border backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isVault = item.icon === "vault";

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-150",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                {isVault ? (
                  <div className="relative">
                    <VaultLogo size="xs" />
                    {/* AI superscript indicator */}
                    <div className="absolute -top-1 -right-2 flex items-center gap-0.5 bg-primary/10 rounded-full px-1 py-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-primary" />
                    </div>
                  </div>
                ) : (
                  <item.icon className="w-5 h-5" />
                )}
                {/* Simple CSS-based active indicator for better performance */}
                <div
                  className={cn(
                    "absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary transition-all duration-150",
                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                  )}
                />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
