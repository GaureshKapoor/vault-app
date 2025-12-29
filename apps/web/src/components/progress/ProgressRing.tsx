import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number; // 0-100
  label?: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "emerald" | "amber" | "blue";
  showValue?: boolean;
  className?: string;
}

const sizes = {
  sm: { diameter: 48, stroke: 4, fontSize: "text-xs" },
  md: { diameter: 64, stroke: 5, fontSize: "text-sm" },
  lg: { diameter: 80, stroke: 6, fontSize: "text-base" },
};

const colors = {
  primary: "stroke-primary",
  emerald: "stroke-emerald-500",
  amber: "stroke-amber-500",
  blue: "stroke-blue-500",
};

export function ProgressRing({
  value,
  label,
  size = "md",
  color = "primary",
  showValue = true,
  className,
}: ProgressRingProps) {
  const { diameter, stroke, fontSize } = sizes[size];
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative">
        <svg
          width={diameter}
          height={diameter}
          className="-rotate-90"
          aria-label={`${label || "Progress"}: ${Math.round(clampedValue)}%`}
        >
          {/* Background circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={stroke}
          />
          {/* Progress circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            className={cn(colors[color], "transition-all duration-700 ease-out")}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        {/* Center value */}
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("font-semibold text-foreground", fontSize)}>
              {Math.round(clampedValue)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-xs text-muted-foreground text-center">{label}</span>
      )}
    </div>
  );
}
