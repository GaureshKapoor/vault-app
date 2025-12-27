import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content area - scrollable with iOS bounce */}
      <main
        className="flex-1 pb-20 overflow-y-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
