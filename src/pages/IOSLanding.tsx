import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VaultLogoWithText } from "@/components/icons/VaultLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

// Example ideas for the swipeable list
const exampleIdeas = [
  {
    template: "{0} that {1}",
    highlights: [
      { text: "A mood tracker", color: "text-blue-400" },
      { text: "uses Spotify listening history", color: "text-green-400" },
    ],
  },
  {
    template: "{0} but it {1}",
    highlights: [
      { text: "Voice memo app", color: "text-orange-400" },
      { text: "auto-transcribes and tags ideas", color: "text-violet-400" },
    ],
  },
  {
    template: "{0} for {1}",
    highlights: [
      { text: "Notion style database", color: "text-rose-400" },
      { text: "tracking side projects and status", color: "text-teal-400" },
    ],
  },
];

/**
 * Minimal landing page for iOS app.
 * Shows hero section with swipeable idea cards.
 * If user is authenticated, redirects to /home.
 */
export default function IOSLanding() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isChecking, setIsChecking] = useState(true);

  // Check if user is already authenticated - redirect to home
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/home", { replace: true });
      } else {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Auto-rotate ideas every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % exampleIdeas.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Render idea card content
  const renderIdeaCard = (idea: typeof exampleIdeas[0]) => {
    const parts = idea.template.split(/\{(\d+)\}/);
    return (
      <p className="text-lg font-medium leading-relaxed text-foreground">
        {parts.map((part, i) => {
          const highlightIndex = parseInt(part);
          if (!isNaN(highlightIndex) && idea.highlights[highlightIndex]) {
            const highlight = idea.highlights[highlightIndex];
            return (
              <span
                key={i}
                className={`${highlight.color} underline decoration-2 underline-offset-4`}
              >
                {highlight.text}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  };

  // Show nothing while checking auth to prevent flash
  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Simple Header */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0">
        <VaultLogoWithText />
        <ThemeToggle />
      </header>

      {/* Hero Content - no scroll, fixed layout */}
      <main className="flex-1 flex flex-col justify-center px-6">
        {/* Badge */}
        <div className="text-center mb-6">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium">
            🚀 Now in Beta
          </Badge>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground text-center mb-6 tracking-tight">
          All Your <span className="text-gradient">Ideas</span>, One Place
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-muted-foreground text-center tracking-wide font-semibold mb-4">
          Less chaos. More building.
        </p>

        {/* Description */}
        <p className="text-base text-muted-foreground/80 text-center max-w-sm mx-auto leading-relaxed mb-6">
          Capture ideas as they come, use AI to refine and evaluate them.
        </p>

        {/* Swipeable Idea Cards */}
        <div className="relative max-w-sm mx-auto w-full mb-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg text-center">
            {renderIdeaCard(exampleIdeas[currentIndex])}
          </div>

          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {exampleIdeas.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 w-2"
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA Buttons - Login / Create Account */}
        <div className="max-w-xs mx-auto w-full space-y-3">
          <Button
            onClick={() => navigate("/auth?mode=signup")}
            variant="hero"
            size="default"
            className="w-full h-12 text-lg"
          >
            Create Account
          </Button>
          <Button
            onClick={() => navigate("/auth?mode=login")}
            variant="outline"
            size="default"
            className="w-full h-12 text-lg"
          >
            Log In
          </Button>
        </div>
      </main>
    </div>
  );
}
