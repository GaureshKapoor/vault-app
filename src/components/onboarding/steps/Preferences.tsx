import { motion } from "framer-motion";
import { Sun, Moon, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreferencesProps {
  theme: "light" | "dark";
  notifications: boolean;
  onThemeChange: (value: "light" | "dark") => void;
  onNotificationsChange: (value: boolean) => void;
}

export function Preferences({ 
  theme, 
  notifications, 
  onThemeChange, 
  onNotificationsChange 
}: PreferencesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Preferences
        </h2>
        <p className="text-muted-foreground">
          Make Vault yours
        </p>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        {/* Theme */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Choose your theme</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onThemeChange("light")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                theme === "light"
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/30 bg-card"
              )}
            >
              <Sun className={cn(
                "w-6 h-6",
                theme === "light" ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "font-medium text-sm",
                theme === "light" ? "text-foreground" : "text-muted-foreground"
              )}>
                Light
              </span>
            </button>
            <button
              onClick={() => onThemeChange("dark")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                theme === "dark"
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/30 bg-card"
              )}
            >
              <Moon className={cn(
                "w-6 h-6",
                theme === "dark" ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "font-medium text-sm",
                theme === "dark" ? "text-foreground" : "text-muted-foreground"
              )}>
                Dark
              </span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Enable reminders and nudges?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNotificationsChange(true)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                notifications
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/30 bg-card"
              )}
            >
              <Bell className={cn(
                "w-6 h-6",
                notifications ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "font-medium text-sm",
                notifications ? "text-foreground" : "text-muted-foreground"
              )}>
                Yes
              </span>
            </button>
            <button
              onClick={() => onNotificationsChange(false)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                !notifications
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/30 bg-card"
              )}
            >
              <BellOff className={cn(
                "w-6 h-6",
                !notifications ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "font-medium text-sm",
                !notifications ? "text-foreground" : "text-muted-foreground"
              )}>
                No
              </span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}