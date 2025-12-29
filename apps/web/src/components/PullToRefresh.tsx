import { useState, useRef, useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNativeApp } from "@/lib/platform";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

/**
 * Pull-to-refresh wrapper component.
 * Only active on native iOS apps.
 */
export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  // Only enable on native apps
  const isEnabled = isNativeApp();

  useEffect(() => {
    if (!isEnabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;

      // Only start pull if at the top of the scroll container
      const scrollTop = container.scrollTop;
      if (scrollTop > 0) return;

      startYRef.current = e.touches[0].clientY;
      currentYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      currentYRef.current = e.touches[0].clientY;
      const diff = currentYRef.current - startYRef.current;

      if (diff > 0) {
        // Apply resistance for rubber band effect
        const resistance = 0.5;
        const distance = Math.min(diff * resistance, MAX_PULL);
        setPullDistance(distance);
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return;

      setIsPulling(false);

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isEnabled, isPulling, isRefreshing, pullDistance, onRefresh]);

  if (!isEnabled) {
    return <div className={className}>{children}</div>;
  }

  const shouldTrigger = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-y-auto", className)}
      style={{
        transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
        transition: !isPulling ? "transform 0.2s ease-out" : undefined,
      }}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-200"
        style={{
          top: -50,
          opacity: pullDistance / PULL_THRESHOLD,
          transform: `rotate(${Math.min(pullDistance / PULL_THRESHOLD, 1) * 360}deg)`,
        }}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          shouldTrigger || isRefreshing ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <Loader2 className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
        </div>
      </div>
      {children}
    </div>
  );
}
