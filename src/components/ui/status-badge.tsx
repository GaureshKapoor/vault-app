import { cn } from "@/lib/utils";

export type IdeaStatus = "Idea" | "Shortlisted" | "Building" | "Paused" | "Shipped" | "Archived";

interface StatusBadgeProps {
  status: IdeaStatus;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const statusStyles: Record<IdeaStatus, string> = {
  Idea: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  Shortlisted: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  Building: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  Paused: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
  Shipped: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  Archived: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className, onClick, interactive }: StatusBadgeProps) {
  const Component = interactive ? "button" : "span";
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        statusStyles[status] || statusStyles.Idea,
        interactive && "cursor-pointer hover:opacity-80",
        className
      )}
    >
      {status}
    </Component>
  );
}

// Export status options for use in dropdowns
export const STATUS_OPTIONS: { value: IdeaStatus; label: string }[] = [
  { value: "Idea", label: "Idea" },
  { value: "Shortlisted", label: "Shortlisted" },
  { value: "Building", label: "Building" },
  { value: "Paused", label: "Paused" },
  { value: "Shipped", label: "Shipped" },
];
