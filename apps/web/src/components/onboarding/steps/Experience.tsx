import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ExperienceProps {
  experience: string;
  tools: string[];
  onExperienceChange: (value: string) => void;
  onToolsChange: (value: string[]) => void;
}

const experienceOptions = [
  { id: "beginner", label: "Just getting started" },
  { id: "some", label: "Some experience" },
  { id: "experienced", label: "Very experienced" },
];

const toolOptions = [
  { id: "lovable", label: "Lovable" },
  { id: "v0", label: "v0 by Vercel" },
  { id: "bolt", label: "bolt.new" },
  { id: "replit", label: "Replit" },
  { id: "cursor", label: "Cursor" },
  { id: "windsurf", label: "Windsurf" },
  { id: "claude_codex", label: "Claude Code / Codex" },
  { id: "none", label: "None of these" },
];

export function Experience({ experience, tools, onExperienceChange, onToolsChange }: ExperienceProps) {
  const toggleTool = (toolId: string) => {
    if (toolId === "none") {
      onToolsChange(["none"]);
      return;
    }
    
    const newTools = tools.filter(t => t !== "none");
    if (newTools.includes(toolId)) {
      onToolsChange(newTools.filter(t => t !== toolId));
    } else {
      onToolsChange([...newTools, toolId]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Your building experience
        </h2>
        <p className="text-muted-foreground">
          This helps Vault tailor how ideas are structured.
        </p>
      </div>

      {/* General Experience */}
      <div className="space-y-3 max-w-md mx-auto">
        <p className="text-sm font-medium text-foreground">
          How experienced are you with building things?
        </p>
        <div className="grid gap-2">
          {experienceOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onExperienceChange(option.id)}
              className={cn(
                "p-3 rounded-lg border-2 transition-all duration-200 text-left",
                experience === option.id
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/30 bg-card"
              )}
            >
              <span className={cn(
                "font-medium",
                experience === option.id ? "text-foreground" : "text-muted-foreground"
              )}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tools Used */}
      <div className="space-y-3 max-w-md mx-auto">
        <p className="text-sm font-medium text-foreground">
          Have you used any of these tools before?
        </p>
        <p className="text-xs text-muted-foreground">Select all that apply</p>
        <div className="flex flex-wrap gap-2">
          {toolOptions.map((option) => {
            const isSelected = tools.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggleTool(option.id)}
                className={cn(
                  "px-4 py-2 rounded-full border-2 transition-all duration-200 text-sm font-medium",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/30 bg-card text-muted-foreground"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}