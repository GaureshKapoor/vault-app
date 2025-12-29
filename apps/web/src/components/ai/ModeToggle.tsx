import { motion } from "framer-motion";
import { MessageSquare, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export type AIMode = "chat" | "generate";

interface ModeToggleProps {
  mode: AIMode;
  onChange: (mode: AIMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
      <button
        onClick={() => onChange("chat")}
        className={cn(
          "relative flex items-center justify-center gap-1.5 rounded-md transition-colors",
          // Mobile: icon only, square button
          "w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5",
          mode === "chat"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Chat mode"
      >
        {mode === "chat" && (
          <motion.div
            layoutId="mode-indicator"
            className="absolute inset-0 bg-background rounded-md shadow-sm"
            transition={{ type: "spring", duration: 0.3 }}
          />
        )}
        <MessageSquare className="w-4 h-4 relative z-10" />
        <span className="relative z-10 hidden md:inline text-sm font-medium">Chat</span>
      </button>
      <button
        onClick={() => onChange("generate")}
        className={cn(
          "relative flex items-center justify-center gap-1.5 rounded-md transition-colors",
          // Mobile: icon only, square button
          "w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5",
          mode === "generate"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Generate mode"
      >
        {mode === "generate" && (
          <motion.div
            layoutId="mode-indicator"
            className="absolute inset-0 bg-background rounded-md shadow-sm"
            transition={{ type: "spring", duration: 0.3 }}
          />
        )}
        <Lightbulb className="w-4 h-4 relative z-10" />
        <span className="relative z-10 hidden md:inline text-sm font-medium">Generate</span>
      </button>
    </div>
  );
}
