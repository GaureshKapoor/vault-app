import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimeCommitmentProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  { id: "less_2", label: "Less than 2 hours per week" },
  { id: "2_5", label: "2–5 hours per week" },
  { id: "5_10", label: "5–10 hours per week" },
  { id: "10_20", label: "10–20 hours per week" },
  { id: "all_in", label: "All in" },
];

export function TimeCommitment({ value, onChange }: TimeCommitmentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Time to ideate
        </h2>
        <p className="text-muted-foreground">
          How much time can you dedicate to finding and iterating your next big idea?
        </p>
      </div>

      <div className="grid gap-3 max-w-md mx-auto">
        {options.map((option) => {
          const isSelected = value === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                isSelected
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/30 bg-card"
              )}
            >
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