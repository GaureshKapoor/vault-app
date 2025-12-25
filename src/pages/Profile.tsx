import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Briefcase, Settings, LogOut, ChevronRight, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check saved theme preference
    const savedTheme = localStorage.getItem("vault-theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // Default to dark mode
      document.documentElement.classList.add("dark");
      localStorage.setItem("vault-theme", "dark");
    }

    // Get user email
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || null);
      }
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("vault-theme", newTheme ? "dark" : "light");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar & Name */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Builder</h2>
            <p className="text-sm text-muted-foreground">Vibe-coding enthusiast</p>
          </div>
        </motion.section>

        {/* Account Info */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Account</h3>
          <div className="space-y-2">
            {[
              { icon: Mail, label: "Email", value: userEmail || "Not set" },
              { icon: Phone, label: "Phone", value: "Not set" },
              { icon: MapPin, label: "Location", value: "Not set" },
              { icon: Briefcase, label: "Experience", value: "Building ideas" },
            ].map((item, index) => (
              <div key={index} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <p className="font-medium text-foreground truncate">{item.value}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </motion.section>

        {/* Settings */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Settings</h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
            {/* Theme Toggle */}
            <div className="px-4 py-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">Dark Mode</span>
                <p className="text-xs text-muted-foreground">{isDarkMode ? "Dark theme" : "Light theme"}</p>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
            </div>

            {/* Preferences */}
            <button className="w-full px-4 py-4 flex items-center gap-4 hover:bg-accent transition-colors">
              <div className="p-2 rounded-lg bg-muted">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-medium text-foreground flex-1 text-left">Preferences</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </motion.section>

        {/* Logout */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </motion.section>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-4">Go from 0 to 1 faster</p>
      </div>
    </div>
  );
}
