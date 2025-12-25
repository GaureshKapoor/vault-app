import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";

// Pages
import WebLanding from "./pages/WebLanding";
import AppStart from "./pages/AppStart";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import OnboardingSetup from "./pages/OnboardingSetup";
import Home from "./pages/Home";
import IdeaDetail from "./pages/IdeaDetail";
import NewIdea from "./pages/NewIdea";
import Inbox from "./pages/Inbox";
import AI from "./pages/AI";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import StartBuilding from "./pages/StartBuilding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Initialize theme on app load - follows system by default, respects user choice
if (typeof window !== "undefined") {
  const savedTheme = localStorage.getItem("vault-theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (savedTheme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    // System preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<WebLanding />} />
          <Route path="/app" element={<AppStart />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/onboarding/setup" element={<OnboardingSetup />} />
          
          {/* Protected App Routes with Bottom Nav */}
          <Route element={<AppLayout />}>
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/ai" element={<ProtectedRoute><AI /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/idea/new" element={<ProtectedRoute><NewIdea /></ProtectedRoute>} />
            <Route path="/idea/:id" element={<ProtectedRoute><IdeaDetail /></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/build" element={<ProtectedRoute><StartBuilding /></ProtectedRoute>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
