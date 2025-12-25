import { motion } from "framer-motion";
import { GraduationCap, User, Rocket, Palette, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhoAreYouProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  { id: "student", label: "Student / Learning", icon: GraduationCap },
  { id: "solo_builder", label: "Solo builder", icon: User },
  { id: "founder", label: "Founder / Indie hacker", icon: Rocket },
  { id: "creator", label: "Creator / Writer / Designer", icon: Palette },
  { id: "explorer", label: "Explorer (ideas, no pressure)", icon: Compass },
];

export function WhoAreYou({ value, onChange }: WhoAreYouProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Who are you building as?
        </h2>
        <p className="text-muted-foreground">
          Which best describes you right now?
        </p>
      </div>

      <div className="grid gap-3 max-w-md mx-auto">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                isSelected
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/30 bg-card"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "font-medium transition-colors",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}