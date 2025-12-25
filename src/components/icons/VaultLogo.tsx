import { cn } from "@/lib/utils";

interface VaultLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export function VaultLogo({ className, size = "md" }: VaultLogoProps) {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Abstract vault / container shape */}
        <rect x="4" y="8" width="14" height="14" rx="3" className="fill-primary" />
        <rect x="22" y="8" width="14" height="14" rx="3" className="fill-primary/60" />
        <rect x="4" y="26" width="14" height="6" rx="2" className="fill-primary/40" />
        <rect x="22" y="26" width="14" height="6" rx="2" className="fill-primary/80" />
      </svg>
    </div>
  );
}

export function VaultLogoWithText({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <VaultLogo size="md" />
      <span className="text-xl font-bold text-foreground tracking-tight">Vault</span>
    </div>
  );
}
