import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, hasSubscription, hasCompletedOnboarding } = useAuthGuard();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If all checks pass, render children
  if (isAuthenticated && hasSubscription && hasCompletedOnboarding) {
    return <>{children}</>;
  }

  // Otherwise, the hook handles navigation
  return null;
}