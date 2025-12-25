import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearBottom(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px 0px -60% 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <Outlet />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none"
          style={{ height: 28 }}
          initial={false}
          animate={{ height: isNearBottom ? 6 : 28 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        />
        <div ref={sentinelRef} className="h-6 w-full" aria-hidden="true" />
      </main>
      <BottomNav />
    </div>
  );
}
