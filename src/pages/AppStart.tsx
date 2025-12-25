import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Archive,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VaultLogoWithText } from "@/components/icons/VaultLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

// ============ DATA ============

interface ExampleIdea {
  template: string;
  highlights: { text: string; color: string }[];
}

const exampleTemplates: ExampleIdea[] = [
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

const taglineWords = ["faster", "better", "effortless"];

const features = [
  {
    icon: Sparkles,
    title: "AI Autofill",
    description: "Structure raw ideas into buildable concepts",
  },
  {
    icon: Target,
    title: "Idea Scoring",
    description: "Get instant AI feedback on viability",
  },
  {
    icon: Archive,
    title: "Idea Vault",
    description: "Organize and track all your ideas",
  },
  {
    icon: Inbox,
    title: "Quick Capture",
    description: "Capture thoughts, convert to ideas later",
  },
];

// ============ COMPONENTS ============

function TemplateCard({ idea }: { idea: ExampleIdea }) {
  const parts = idea.template.split(/\{(\d+)\}/);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg text-center">
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
    </div>
  );
}

function AnimatedTagline() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % taglineWords.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-12 flex items-center justify-center mt-2">
      <span
        key={taglineWords[currentWordIndex]}
        className="text-3xl font-bold text-gradient italic animate-fade-in"
      >
        {taglineWords[currentWordIndex]}
      </span>
    </div>
  );
}

// ============ MAIN PAGE ============

export default function AppStart() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const swipeThreshold = 80;

  const cardVariants = {
    enter: (dir: number) => ({ x: dir * 80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -80, opacity: 0 }),
  };

  const paginate = (newDirection: number) => {
    setIsAutoPlaying(false);
    setDirection(newDirection);
    setCurrentIndex(
      (prev) => (prev + newDirection + exampleTemplates.length) % exampleTemplates.length
    );
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % exampleTemplates.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrev = () => paginate(-1);
  const handleNext = () => paginate(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted dark:gradient-dark-hero flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <VaultLogoWithText />
        <ThemeToggle />
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-4"
        >
          <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium">
            Now in Beta
          </Badge>

          <h1 className="text-3xl font-bold text-foreground mb-1 tracking-tight">
            All Your <span className="text-gradient">Ideas</span>, One Place
          </h1>
          <AnimatedTagline />

          <p className="text-base text-muted-foreground mt-4 max-w-sm mx-auto leading-relaxed">
            Capture ideas, use AI to refine them, and move from thoughts to execution.
          </p>
        </motion.div>

        {/* Idea Cards Carousel */}
        <div className="flex-1 flex flex-col justify-center py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-md mx-auto w-full"
          >
            <div className="min-h-[100px] flex items-center">
              <div className="w-full">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={cardVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragStart={() => setIsAutoPlaying(false)}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > swipeThreshold) paginate(-1);
                      if (info.offset.x < -swipeThreshold) paginate(1);
                    }}
                    className="will-change-transform touch-pan-y"
                  >
                    <TemplateCard idea={exampleTemplates[currentIndex]} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <button
                onClick={handlePrev}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Previous idea"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-xs text-muted-foreground">
                Swipe through sample ideas
              </span>

              <button
                onClick={handleNext}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Next idea"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Dots indicator */}
            <div className="flex items-center justify-center gap-2 mt-3">
              {exampleTemplates.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to template ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-0.5">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="pb-8"
        >
          <Button
            onClick={() => navigate("/auth?mode=signup")}
            variant="hero"
            size="default"
            className="w-full h-12 text-base"
          >
            Get Started Free
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/auth?mode=login")}
              className="text-primary hover:underline"
            >
              Log in
            </button>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
