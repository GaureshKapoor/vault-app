import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BookOpen, Target, Zap, FolderOpen, Lightbulb, CheckCircle, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

interface GoalsProps {
  value: string[];
  otherGoal: string;
  onChange: (value: string[]) => void;
  onOtherGoalChange: (value: string) => void;
}

const options = [
  { id: "learn", label: "Learn how to build", icon: BookOpen },
  { id: "decide", label: "Decide what idea to work on next", icon: Target },
  { id: "ship", label: "Ship MVPs faster", icon: Zap },
  { id: "organize", label: "Organize and refine ideas", icon: FolderOpen },
  { id: "explore", label: "Explore startup ideas", icon: Lightbulb },
  { id: "action", label: "Turn thoughts into action", icon: CheckCircle },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

export function Goals({ value, otherGoal, onChange, onOtherGoalChange }: GoalsProps) {
  const toggleGoal = (goalId: string) => {
    if (value.includes(goalId)) {
      const filtered = value.filter(g => g !== goalId);
      onChange(filtered);
      if (goalId === "other") {
        onOtherGoalChange("");
      }
    } else {
      onChange([...value, goalId]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          What do you want Vault to help you with?
        </h2>
        <p className="text-muted-foreground">
          What are you here to do? Select all that apply.
        </p>
      </div>

      <div className="grid gap-3 max-w-md mx-auto">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value.includes(option.id);
          
          return (
            <button
              key={option.id}
              onClick={() => toggleGoal(option.id)}
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
                "font-medium transition-colors flex-1",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}>
                {option.label}
              </span>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
        
        {/* Other goal input */}
        {value.includes("other") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2"
          >
            <Input
              placeholder="What's your goal?"
              value={otherGoal}
              onChange={(e) => onOtherGoalChange(e.target.value)}
              maxLength={100}
              className="max-w-md"
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}